import { describe, it, expect } from "vitest";
import { INTRO_SCENES, introSeconds } from "./introScenes";

describe("INTRO_SCENES", () => {
  it("tells the video's story in order, in a minute or less", () => {
    expect(INTRO_SCENES.map((s) => s.id)).toEqual([
      "title",
      "study",
      "scan",
      "slices",
      "caliper",
      "record",
      "graft",
      "results",
      "end",
    ]);
    expect(introSeconds()).toBe(INTRO_SCENES.reduce((sum, s) => sum + s.seconds, 0));
    expect(introSeconds()).toBeLessThanOrEqual(60);
  });

  it("gives each caption time to be read, at three words a second at most", () => {
    for (const scene of INTRO_SCENES) {
      const words = scene.caption.split(/\s+/).length;
      expect(words / scene.seconds, scene.id).toBeLessThanOrEqual(3);
    }
  });

  it("writes its captions without em or en dashes", () => {
    for (const scene of INTRO_SCENES) expect(scene.caption, scene.id).not.toMatch(/[–—]/);
  });
});
