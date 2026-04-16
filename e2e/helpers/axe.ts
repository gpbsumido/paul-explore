import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Run an axe accessibility scan against the current page state and assert
 * zero WCAG 2.x AA violations. Throws with a readable diff of each violation
 * (impact, rule, element, description) when the assertion fails.
 *
 * @param page - Playwright Page object (already navigated to the target URL)
 * @param label - Short description of the scan context, used in the failure message
 */
export async function checkA11y(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const formatted = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.map((n) => n.html.slice(0, 120)),
  }));

  expect(
    formatted,
    `Axe violations on "${label}" — fix before merging`,
  ).toEqual([]);
}
