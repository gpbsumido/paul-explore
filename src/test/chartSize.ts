import { cloneElement, type ReactElement } from "react";

/**
 * Gives Recharts a box to draw in.
 *
 * jsdom does no layout, so every element measures 0 by 0. Recharts'
 * ResponsiveContainer reads its size from the element, got nothing, printed
 * "The width(-1) and height(-1) of chart should be greater than 0" and drew no
 * chart at all. The tests then passed while checking an empty box.
 *
 * This swaps ResponsiveContainer for a wrapper that hands its chart a fixed
 * width and height, which is all the container ever does. Use it as the
 * `recharts` mock in a test file that renders a chart:
 *
 *   vi.mock("recharts", async (importOriginal) => {
 *     const { withFixedChartSize } = await import("@/test/chartSize");
 *     return withFixedChartSize(await importOriginal<typeof import("recharts")>());
 *   });
 *
 * The chart is then really drawn, so the test looks at the real thing.
 */
export function withFixedChartSize<Recharts extends object>(
  recharts: Recharts,
  { width = 800, height = 400 }: { width?: number; height?: number } = {},
) {
  return {
    ...recharts,
    ResponsiveContainer: ({
      children,
    }: {
      children: ReactElement<{ width?: number; height?: number }>;
    }) => cloneElement(children, { width, height }),
  };
}
