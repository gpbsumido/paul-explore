import { describe, it, expect } from "vitest";
import { distanceMm, toGray, score, WINDOWS, TOLERANCE_MM } from "./measure";

const reference = {
  neckDiameter: 24,
  neckLength: 20,
  maxSac: 58,
  rightCia: 14,
  leftCia: 13,
};

describe("distanceMm", () => {
  it("scales the pixel distance by the pixel spacing", () => {
    expect(distanceMm({ x: 0, y: 0 }, { x: 30, y: 40 }, 0.5)).toBe(25);
  });
});

describe("toGray", () => {
  it("maps the window's edges to black and white and the level to mid-grey", () => {
    const angio = WINDOWS.angio;
    expect(toGray(angio.level - angio.width / 2 - 100, angio)).toBe(0);
    expect(toGray(angio.level + angio.width / 2 + 100, angio)).toBe(255);
    expect(toGray(angio.level, angio)).toBe(128);
  });
});

describe("score", () => {
  it("passes a measurement inside the tolerance", () => {
    const rows = score({ neckDiameter: 24 + TOLERANCE_MM.neckDiameter }, reference);
    const neck = rows.find((r) => r.id === "neckDiameter")!;
    expect(neck.verdict).toBe("within");
    expect(neck.delta).toBeCloseTo(TOLERANCE_MM.neckDiameter);
  });

  it("fails a measurement outside the tolerance, in either direction", () => {
    const rows = score({ neckLength: 10, maxSac: 64 }, reference);
    expect(rows.find((r) => r.id === "neckLength")!.verdict).toBe("outside");
    expect(rows.find((r) => r.id === "maxSac")!.verdict).toBe("outside");
  });

  it("scores against whatever tolerances the level hands it", () => {
    const wide = { ...TOLERANCE_MM, neckDiameter: 3 };
    expect(score({ neckDiameter: 26.5 }, reference)[0].verdict).toBe("outside");
    expect(score({ neckDiameter: 26.5 }, reference, wide)[0].verdict).toBe("within");
  });

  it("leaves an unmeasured task unmeasured rather than failing it", () => {
    const rows = score({}, reference);
    expect(rows).toHaveLength(5);
    expect(rows.every((r) => r.verdict === "unmeasured" && r.delta === null)).toBe(
      true,
    );
  });
});
