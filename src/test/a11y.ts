import { configureAxe } from "vitest-axe";

/**
 * Pre-configured axe instance scoped to WCAG 2.1 AA rules.
 * Pass a rendered container (e.g. from Testing Library's `render().container`)
 * and await the result. Pair with `expect(results).toHaveNoViolations()`.
 */
export const axe = configureAxe({
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  },
});
