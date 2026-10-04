import type { Page } from "@playwright/test";

/**
 * Wait until the page is in the state an axe scan should measure: loaded,
 * themed, painted and done animating. Every wait here is a fact about the page
 * itself rather than about a third party answering.
 *
 * @param page - Playwright Page object, already navigated to the target URL
 */
export async function waitForPageToSettle(page: Page) {
  // Deliberately not networkidle. These pages poll and fetch from a third
  // party, so "no requests for 500ms" is a promise about someone else's
  // infrastructure, not about this page. When stats.nba.com stopped
  // answering, two of these routes went red with nothing wrong in the diff
  // -- and a check that fails for reasons unrelated to the change gets
  // ignored, which is worse than not having it. The page's own main
  // landmark is what an accessibility scan actually needs.
  await page.waitForLoadState("load");
  await page.locator("main").first().waitFor({ state: "visible" });
  // Fonts change computed colours, and axe's contrast rule reads them, so
  // scanning before they settle reports violations that do not exist.
  await page.evaluate(() => document.fonts.ready);
  // Same reasoning, one layer down. Every colour on the page comes from a
  // custom property, and the theme that defines them is applied by script.
  // Scanning first reports every muted and foreground element as failing
  // contrast at once -- which is the tell, because if the foreground token
  // really failed the app would be unreadable rather than slightly off.
  await page.waitForFunction(() => {
    const root = document.documentElement;
    if (!root.dataset.theme) return false;
    const style = getComputedStyle(root);
    // Every one of these, not just the foreground. They are aliases of
    // @paul-portfolio/tokens now, and an alias whose source stylesheet has
    // not arrived yet resolves to nothing rather than to an error, so a
    // scan can catch the page with its text in the browser default over a
    // surface that is already correct. One token proves one stylesheet
    // landed; the palette needs all of them.
    return ["--color-foreground", "--color-background", "--color-muted"]
      .map((token) => style.getPropertyValue(token).trim())
      .every((value) => value.length > 0);
  });
  // And the page's own text has to be painted in those colours. The wait
  // above proves the tokens resolve at the root; this proves the cascade
  // reached the content, which under a dev server compiling routes on
  // demand is a separate event and the one the scan kept racing.
  await page.waitForFunction(() => {
    const main = document.querySelector("main");
    if (!main) return false;
    const color = getComputedStyle(main).color;
    return color !== "" && color !== "rgb(0, 0, 0)";
  });
  // And once more for anything still fading in. A contrast rule reads the
  // colour as it is at that instant, so an element mid-transition measures
  // against a background it is only passing through. Waiting for the
  // page's own animations to finish is still a fact about this page, which
  // is the property that matters -- unlike networkidle, nothing here
  // depends on a third party answering.
  await page
    .waitForFunction(
      () =>
        document
          .getAnimations()
          .every((a) => a.playState !== "running"),
      undefined,
      { timeout: 5_000 },
    )
    .catch(() => {
      // Some pages animate forever by design (the particle lab). Those are
      // decorative, so carry on rather than fail a scan on a loop that is
      // never going to stop.
    });
}
