import { test, expect } from "@playwright/test";

test.describe("TCG card browser", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tcg/pokemon");
    // Wait for at least one card tile to confirm the initial page loaded.
    await page.waitForSelector('a[href^="/tcg/pokemon/card/"]', {
      timeout: 15_000,
    });
  });

  test("search filters the card list", async ({ page }) => {
    const cardLocator = page.locator('a[href^="/tcg/pokemon/card/"]');

    // Capture the card IDs shown on the unfiltered page.
    const initialHrefs = await cardLocator.evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")),
    );

    const searchInput = page.getByPlaceholder("Search cards…");
    await searchInput.fill("Pikachu");

    // Wait for the 350 ms debounce to fire and the URL to reflect the query.
    // This is the most reliable signal that a new fetch was issued.
    await expect(page).toHaveURL(/[?&]q=Pikachu/, { timeout: 5_000 });

    // Wait for the grid to repopulate with filtered results.
    await page.waitForSelector('a[href^="/tcg/pokemon/card/"]', {
      timeout: 10_000,
    });

    // At least one card should be visible and the returned card IDs should
    // differ from the unfiltered set. Comparing IDs (not counts) is robust
    // when both result sets happen to be the same size (e.g. a full page).
    const filteredHrefs = await cardLocator.evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")),
    );
    expect(filteredHrefs.length).toBeGreaterThan(0);
    expect(filteredHrefs).not.toEqual(initialHrefs);
  });

  test("scrolling to the sentinel loads additional cards", async ({ page }) => {
    // Count cards before scrolling.
    const tiles = page.locator('a[href^="/tcg/pokemon/card/"]');
    const initialCount = await tiles.count();

    // Scroll the invisible sentinel div into view to trigger the
    // IntersectionObserver that calls fetchNextPage().
    const sentinel = page.locator("div.h-8").last();
    await sentinel.scrollIntoViewIfNeeded();

    // Wait until more cards appear than the initial count.
    await expect
      .poll(async () => tiles.count(), { timeout: 15_000 })
      .toBeGreaterThan(initialCount);
  });

  test("clicking a card opens its detail page", async ({ page }) => {
    const firstCard = page.locator('a[href^="/tcg/pokemon/card/"]').first();
    const cardName = await firstCard.locator("p").textContent();
    await firstCard.click();

    // Should navigate to /tcg/pokemon/card/:id
    await expect(page).toHaveURL(/\/tcg\/pokemon\/card\//);

    // The card name should appear in the heading on the detail page.
    if (cardName) {
      await expect(
        page.getByRole("heading", { name: cardName, exact: false }),
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});
