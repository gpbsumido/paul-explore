import { act } from "@testing-library/react";
import { configureAxe } from "vitest-axe";

/**
 * Axe scans asynchronously, and a page with a timer or an animation frame
 * updates state while it waits. Run bare, every one of those updates logged
 * "not wrapped in act()", so the scan runs inside act and the updates land
 * where React expects them.
 */
const runAxe = configureAxe({
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  },
});

/**
 * Pre-configured axe instance scoped to WCAG 2.1 AA rules.
 * Pass a rendered container (e.g. from Testing Library's `render().container`)
 * and await the result. Pair with `expect(results).toHaveNoViolations()`.
 */
export async function axe(
  ...scanArguments: Parameters<typeof runAxe>
): Promise<Awaited<ReturnType<typeof runAxe>>> {
  let results: Awaited<ReturnType<typeof runAxe>> | undefined;
  await act(async () => {
    results = await runAxe(...scanArguments);
  });
  if (results === undefined) throw new Error("axe finished without a result");
  return results;
}
