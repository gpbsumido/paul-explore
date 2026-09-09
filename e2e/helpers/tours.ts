import type { Page } from "@playwright/test";

/** The localStorage key each feature's first-run guided tour checks. */
export const TOUR_SEEN_KEYS = [
  "zeroproof-tour-seen",
  "fantasy-tour-seen",
  "tcg-tour-seen",
  "vitals-tour-seen",
  "operator-tour-seen",
  "design-system-tour-seen",
];

/**
 * Mark every first-run tour as already seen before the page's scripts run, so
 * an auto-opening coach-mark doesn't cover the UI a test is driving or the
 * content an axe scan is measuring. Call in a test.beforeEach, the same way the
 * theme preference is pinned. The tours' own behaviour is covered by unit tests.
 */
export async function disableTours(page: Page) {
  await page.addInitScript((keys: string[]) => {
    for (const key of keys) window.localStorage.setItem(key, "true");
  }, TOUR_SEEN_KEYS);
}
