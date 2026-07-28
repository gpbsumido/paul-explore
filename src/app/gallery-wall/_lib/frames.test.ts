import { describe, it, expect } from "vitest";
import {
  FRAME_SIZES,
  frameById,
  frameDimensions,
  chooseBestFrame,
} from "./frames";

describe("FRAME_SIZES", () => {
  it("lists standard sizes short side first, in ascending area", () => {
    for (const size of FRAME_SIZES) {
      expect(size.short).toBeLessThanOrEqual(size.long);
      expect(size.label).toContain("×");
    }
    const areas = FRAME_SIZES.map((s) => s.short * s.long);
    const sorted = [...areas].sort((a, b) => a - b);
    expect(areas).toEqual(sorted);
  });

  it("gives every size a unique id", () => {
    const ids = FRAME_SIZES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("frameById", () => {
  it("finds a size by its id", () => {
    expect(frameById("8x10")?.label).toBe("8 × 10");
  });

  it("returns undefined for an unknown id", () => {
    expect(frameById("nope")).toBeUndefined();
  });
});

describe("frameDimensions", () => {
  it("keeps the short side as width in portrait", () => {
    const dims = frameDimensions({ sizeId: "8x10", orientation: "portrait" });
    expect(dims).toEqual({ width: 8, height: 10 });
  });

  it("swaps to long side as width in landscape", () => {
    const dims = frameDimensions({ sizeId: "8x10", orientation: "landscape" });
    expect(dims).toEqual({ width: 10, height: 8 });
  });

  it("falls back to the default size for an unknown id", () => {
    const dims = frameDimensions({ sizeId: "nope", orientation: "portrait" });
    expect(dims).toEqual({ width: 11, height: 14 });
  });
});

describe("chooseBestFrame", () => {
  it("picks portrait for a tall image", () => {
    expect(chooseBestFrame(0.7).orientation).toBe("portrait");
  });

  it("picks landscape for a wide image", () => {
    expect(chooseBestFrame(1.5).orientation).toBe("landscape");
  });

  it("treats a square image as portrait", () => {
    expect(chooseBestFrame(1).orientation).toBe("portrait");
  });

  it("uses the default size whatever the image aspect, since photos are fitted", () => {
    // Photos are fitted inside the mat rather than cropped, so the frame size no
    // longer chases the image's aspect ratio -- only the orientation does.
    expect(chooseBestFrame(4 / 6).sizeId).toBe("11x14");
    expect(chooseBestFrame(0.8).sizeId).toBe("11x14");
    expect(chooseBestFrame(1.6).sizeId).toBe("11x14");
  });
});
