import { describe, it, expect } from "vitest";
import { FEATURES, THOUGHTS } from "./featureData.data";
import { isInToneBand } from "@/test/toneBand";

/**
 * The 4.7.0 palette swap retuned the FEATURES accents into one muted tone
 * band and left the 60 THOUGHTS hexes on stock Tailwind pastels, which is
 * visible on the /discover reels and the v3 graph. This pins every registry
 * colour into the same band: hue is free (it is the category identity),
 * tone is not. A stock 300-level pastel or a 500-level neon both fail.
 */
describe("registry colour tone band", () => {
  const offenders = (items: { title: string; color?: string }[]) =>
    items
      .filter((item) => item.color && !isInToneBand(item.color))
      .map((item) => `${item.title}: ${item.color}`);

  it("keeps every feature accent in the band", () => {
    expect(offenders(FEATURES)).toEqual([]);
  });

  it("keeps every write-up accent in the band", () => {
    expect(offenders(THOUGHTS)).toEqual([]);
  });
});
