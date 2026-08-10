import { describe, it, expect } from "vitest";
import {
  chooseBestFrame,
  canPrintAt,
  frameById,
  MIN_PRINT_DPI,
} from "./frames";

// 11x14 at 150 DPI needs 1650 x 2100 pixels.
const bigEnough = { width: 1800, height: 2400 };
const tooSmall = { width: 800, height: 1000 };

describe("chooseBestFrame default size", () => {
  it("frames a high-resolution photo at 11x14", () => {
    expect(chooseBestFrame(0.8, bigEnough).sizeId).toBe("11x14");
  });

  it("defaults to 11x14 when the resolution is unknown", () => {
    expect(chooseBestFrame(0.8).sizeId).toBe("11x14");
    expect(chooseBestFrame(1.5).sizeId).toBe("11x14");
  });

  it("steps down to the biggest size a low-resolution photo can carry", () => {
    // 800x1000 clears 5x7 at 150 DPI (750x1050 needed? no) -- check it picked
    // something smaller than the default and that the choice is printable.
    const frame = chooseBestFrame(0.8, tooSmall);
    expect(frame.sizeId).not.toBe("11x14");
    expect(canPrintAt(frameById(frame.sizeId)!, tooSmall)).toBe(true);
  });

  it("never picks a size the photo cannot print sharply", () => {
    for (const res of [tooSmall, { width: 1200, height: 1600 }, bigEnough]) {
      const frame = chooseBestFrame(0.8, res);
      expect(canPrintAt(frameById(frame.sizeId)!, res)).toBe(true);
    }
  });

  it("falls back to the smallest size for a tiny photo", () => {
    expect(chooseBestFrame(0.8, { width: 100, height: 120 }).sizeId).toBe(
      "4x6",
    );
  });

  it("never upsizes past the default, however big the photo", () => {
    expect(chooseBestFrame(0.8, { width: 12000, height: 16000 }).sizeId).toBe(
      "11x14",
    );
  });

  it("still takes orientation from the photo", () => {
    expect(chooseBestFrame(1.6, bigEnough).orientation).toBe("landscape");
    expect(chooseBestFrame(0.7, bigEnough).orientation).toBe("portrait");
    expect(chooseBestFrame(1, bigEnough).orientation).toBe("portrait");
  });
});

describe("canPrintAt", () => {
  it("measures against the minimum print resolution", () => {
    const size = frameById("8x10")!;
    expect(
      canPrintAt(size, {
        width: 8 * MIN_PRINT_DPI,
        height: 10 * MIN_PRINT_DPI,
      }),
    ).toBe(true);
    expect(
      canPrintAt(size, {
        width: 8 * MIN_PRINT_DPI - 1,
        height: 10 * MIN_PRINT_DPI,
      }),
    ).toBe(false);
  });

  it("ignores which way round the pixels are given", () => {
    const size = frameById("8x10")!;
    expect(canPrintAt(size, { width: 1500, height: 1200 })).toBe(true);
    expect(canPrintAt(size, { width: 1200, height: 1500 })).toBe(true);
  });
});
