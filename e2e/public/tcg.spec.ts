import { test, expect } from "@playwright/test";
import { checkA11y } from "../helpers/axe";

test.describe("TCG card browser", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tcg/pokemon");
    // Wait for at least one card tile to confirm the initial page loaded.
    await page.waitForSelector('a[href^="/tcg/pokemon/card/"]', {
      timeout: 15_000,
    });
  });

  test("browse page has no axe violations", async ({ page }) => {
    await checkA11y(page, "/tcg/pokemon (browse)");
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

    // Wait for the filtered API response to land before reading the DOM.
    // waitForSelector is not enough — initial cards are already in the DOM so
    // it resolves immediately before the filtered results replace them.
    await page.waitForResponse(
      (res) =>
        res.url().includes("/api/tcg/cards") &&
        res.url().includes("q=Pikachu"),
      { timeout: 10_000 },
    );

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

  test("card detail page has no axe violations", async ({ page }) => {
    // Grab the href directly rather than clicking — the IntersectionObserver
    // in BrowseContent fires immediately (200px margin) and router.replace
    // can race with Link navigation if we click while URL is still updating.
    const firstCard = page.locator('a[href^="/tcg/pokemon/card/"]').first();
    const href = await firstCard.getAttribute("href");
    const cardName = await firstCard.locator("p").textContent();

    if (!href) throw new Error("First card has no href");

    await page.goto(href);
    await expect(page).toHaveURL(/\/tcg\/pokemon\/card\//);

    if (cardName) {
      await expect(
        page.getByRole("heading", { name: cardName, exact: false }),
      ).toBeVisible({ timeout: 10_000 });
    }

    await checkA11y(page, "/tcg/pokemon/card/:id (detail)");
  });
});
