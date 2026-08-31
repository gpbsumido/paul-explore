import { test, expect } from "@playwright/test";
import { checkA11y } from "../helpers/axe";

test.describe("TCG card browser", () => {
  test.beforeEach(async ({ page }) => {
    // Serve the unfiltered first page from a fixture so this whole block stops
    // depending on TCGdex being reachable from CI. The search test already
    // mocked its own fetch for that reason; the beforeEach did not, so it
    // still waited on real card tiles — and when TCGdex's GeoDNS started
    // pointing North America (where the runners are) at a dead node, every
    // test in the file failed on a page that was working fine.
    //
    // Only the unfiltered request is stubbed. Anything carrying q= falls
    // through so the search test keeps controlling its own response.
    await page.route(/\/api\/tcg\/cards/, async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("q")) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          Array.from({ length: 20 }, (_, i) => ({
            id: `base1-${i + 1}`,
            name: `Card ${i + 1}`,
            localId: String(i + 1),
          })),
        ),
      });
    });

    await page.goto("/tcg/pokemon");
    // Wait for at least one card tile to confirm the initial page loaded.
    await page.waitForSelector('a[href^="/tcg/pokemon/card/"]', {
      timeout: 15_000,
    });
    // Wait for all network activity to stop — React 19 hydration can
    // briefly clear and re-insert <title> during head reconciliation.
    // networkidle ensures JS execution (including hydration) has settled
    // before we run axe or interact with the page.
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => document.title.length > 0, null, {
      timeout: 5_000,
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
        // fallback(), not continue(): defer to the beforeEach stub rather than
        // going to the network, which is the dependency this file is shedding.
        await route.fallback();
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

    if (!href) throw new Error("First card has no href");

    await page.goto(href);
    await expect(page).toHaveURL(/\/tcg\/pokemon\/card\//);

    // This page renders on the server straight from TCGdex, so unlike the list
    // it cannot be stubbed from the browser. With that API unreachable the
    // route throws into its error boundary and still answers 200, so neither
    // the status code nor "is there an h1" tells you anything — the error page
    // has an h1 of its own.
    //
    // Skipping is the honest outcome. Auditing a page that failed to load its
    // subject is a green tick for nothing, and the error boundary has its own
    // axe violations, which are a separate bug rather than this page's.
    const errored = await page
      .getByRole("heading", { name: /something went wrong/i })
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    test.skip(
      errored,
      "TCGdex unreachable — card detail fell through to its error boundary",
    );

    await checkA11y(page, "/tcg/pokemon/card/:id (detail)");
  });
});
