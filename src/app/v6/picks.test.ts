import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { previewSrc } from "../v5/featured";
import { featureFor, HERO_IMAGE_IDS, PROJECT_PICKS, TILE_IDS } from "./picks";

/**
 * The landing names its projects by id in three places: the hero gallery, the
 * project rows and the field-notes wall. Two of them used to drop an id that
 * wasn't in FEATURES without a word, so a renamed feature just vanished from the
 * page, and the preview guard only covered the old v5 shortlist.
 */
const EVERY_ID = [...new Set([...HERO_IMAGE_IDS, ...TILE_IDS, ...PROJECT_PICKS.map((p) => p.id)])];

describe("the v6 landing's picks", () => {
  it.each(EVERY_ID)("%s is a hub feature with light and dark captures", (id) => {
    expect(featureFor(id).id).toBe(id);
    for (const theme of ["light", "dark"] as const) {
      expect(existsSync(join(process.cwd(), "public", previewSrc(id, theme)))).toBe(true);
    }
  });

  it("names the id it couldn't find rather than dropping it", () => {
    expect(() => featureFor("not-a-feature")).toThrow(/"not-a-feature"/);
  });
});
