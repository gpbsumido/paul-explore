import { describe, it, expect } from "vitest";
import { HOW_TO_SCENES, howToSeconds } from "./howToScenes";

describe("HOW_TO_SCENES", () => {
  it("walks through the measurements in the order they're taken, in a minute or less", () => {
    expect(HOW_TO_SCENES.map((s) => s.id)).toEqual([
      "title",
      "renal",
      "diameter",
      "wall",
      "length",
      "sac",
      "iliacs",
      "graft",
      "check",
      "end",
    ]);
    expect(howToSeconds()).toBe(HOW_TO_SCENES.reduce((sum, s) => sum + s.seconds, 0));
    expect(howToSeconds()).toBeLessThanOrEqual(60);
  });

  it("gives each caption time to be read, at three words a second at most", () => {
    for (const scene of HOW_TO_SCENES) {
      expect(scene.caption.split(/\s+/).length / scene.seconds, scene.id).toBeLessThanOrEqual(3);
    }
  });

  it("writes its captions without em or en dashes, and in Canadian spelling", () => {
    for (const scene of HOW_TO_SCENES) {
      expect(scene.caption, scene.id).not.toMatch(/[–—]/);
      expect(scene.caption, scene.id).not.toMatch(/\bcenter/i);
    }
  });
});
