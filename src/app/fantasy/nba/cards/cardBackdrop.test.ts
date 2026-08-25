import { describe, it, expect } from "vitest";
import { cardBackdrop } from "./cardBackdrop";
import { RARITY_META } from "@/lib/fantasy-cards";

describe("cardBackdrop", () => {
  it("is deterministic — the same card always draws the same backdrop", () => {
    const a = cardBackdrop("Victor Wembanyama|Apr 17|sir", "sir");
    const b = cardBackdrop("Victor Wembanyama|Apr 17|sir", "sir");
    expect(a).toEqual(b);
  });

  it("leads the palette with the rarity accent", () => {
    const backdrop = cardBackdrop("someone|2025 season|rare", "rare");
    expect(backdrop.colors[0]).toBe(RARITY_META.rare.color);
    expect(backdrop.colors).toHaveLength(3);
  });

  it("gives different cards different treatments", () => {
    const seeds = Array.from({ length: 12 }, (_, i) =>
      JSON.stringify(cardBackdrop(`player-${i}|d|common`, "common")),
    );
    // Not all twelve collapse to one look.
    expect(new Set(seeds).size).toBeGreaterThan(1);
  });

  it("only ever picks a known variant", () => {
    for (let i = 0; i < 20; i++) {
      const { variant } = cardBackdrop(`x-${i}`, "uncommon");
      expect(["mesh", "blob", "both"]).toContain(variant);
    }
  });
});
