import { describe, it, expect } from "vitest";
import { readableOn, chipColors, contrastRatio } from "./readableOn";

/**
 * A chip fills with whatever colour its caller hands it and then has to put a
 * label on top. Hardcoding white works right up until an accent is light
 * enough to fail against it: the design system's own accent measured 4.16:1 on
 * this page, under AA, and nothing caught it because the accent itself is in
 * the palette's tone band. The band governs the fill, not the text on it.
 *
 * Picking the label from the fill's luminance makes the component correct for
 * any colour a caller passes, rather than correct for the ones we happened to
 * try.
 */
describe("readableOn", () => {
  it("puts dark ink on a light fill", () => {
    expect(readableOn("#f6a623")).toBe("#1d1a15");
  });

  it("puts white on a dark fill", () => {
    expect(readableOn("#124f47")).toBe("#ffffff");
  });

  it("cannot rescue a mid-tone fill with a label alone", () => {
    // Worth pinning: this is why chipColors exists. Neither white nor ink
    // clears AA on this accent, so the fill has to move.
    const fill = "#2b8a7e";
    expect(contrastRatio(readableOn(fill) as string, fill)).toBeLessThan(4.5);
  });

  it("darkens the fill until the pair clears AA, keeping the hue", () => {
    const pair = chipColors("#2b8a7e");
    expect(pair).toBeDefined();
    expect(contrastRatio(pair!.color, pair!.background)).toBeGreaterThanOrEqual(4.5);
    expect(pair!.background).not.toBe("#2b8a7e");
  });

  it("clears AA across every feature accent in the palette", async () => {
    const { FEATURES } = await import("@/app/_shared/featureData.data");
    const failures = FEATURES.filter((feature) => feature.color)
      .map((feature) => {
        const pair = chipColors(feature.color as string);
        return {
          id: feature.id,
          ratio: pair ? contrastRatio(pair.color, pair.background) : 0,
        };
      })
      .filter((result) => result.ratio < 4.5);

    expect(failures).toEqual([]);
  });

  it("leaves a colour it cannot parse alone rather than guessing", () => {
    expect(readableOn("var(--color-primary-500)")).toBeUndefined();
    expect(chipColors("var(--color-primary-500)")).toBeUndefined();
  });
});
