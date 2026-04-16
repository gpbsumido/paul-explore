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

    // Mock the internal cards API so this test doesn't depend on TCGdex being
    // reachable in CI. The mock only kicks in for requests that include q=
    // (i.e. the search fetch) and returns a fixed set of Pikachu cards whose
    // hrefs are guaranteed to differ from the unfiltered initial set.
    await page.route(/\/api\/tcg\/cards/, async (route) => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get("q") ?? "";

      if (q.toLowerCase().includes("pikachu")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "base1-58", name: "Pikachu", localId: "58" },
            { id: "base2-28", name: "Pikachu", localId: "28" },
            { id: "jungle-60", name: "Pikachu", localId: "60" },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    const searchInput = page.getByPlaceholder("Search cards…");
    await searchInput.fill("Pikachu");

    // Wait for the 350 ms debounce to fire and the URL to reflect the query.
    // This is the most reliable signal that a new fetch was issued.
    await expect(page).toHaveURL(/[?&]q=Pikachu/, { timeout: 5_000 });

    // Poll until the mock Pikachu cards appear in the DOM. Using a known card
    // href (from the mock payload) avoids a false-positive on the brief empty
    // state that can occur while React Query replaces the previous page.
    await expect
      .poll(
        () =>
          cardLocator.evaluateAll((els) =>
            els.map((el) => el.getAttribute("href")),
          ),
        { timeout: 10_000 },
      )
      .toContainEqual("/tcg/pokemon/card/base1-58");
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
