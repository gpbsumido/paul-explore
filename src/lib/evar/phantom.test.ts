import { describe, it, expect } from "vitest";
import { EVAR_CASES, sliceHU, referenceFor, outerRadiusMm } from "./phantom";

const huAt = (slice: Int16Array, size: number, x: number, y: number) =>
  slice[Math.round(y) * size + Math.round(x)];

const range = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => from + i);

const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

/** How many pixels in a box have a value in [lo, hi]. */
const countIn = (slice: Int16Array, size: number, box: { x0: number; x1: number; y0: number; y1: number }, lo: number, hi: number) =>
  range(Math.max(0, Math.round(box.y0)), Math.min(size, Math.round(box.y1))).reduce(
    (sum, y) =>
      sum +
      range(Math.max(0, Math.round(box.x0)), Math.min(size, Math.round(box.x1))).filter((x) => {
        const hu = huAt(slice, size, x, y);
        return hu >= lo && hu <= hi;
      }).length,
    0,
  );

/**
 * The row through the middle of the vertebral body, found from the image
 * itself: the median of the marrow-density pixels down the midline.
 */
const spineRow = (slice: Int16Array, size: number) =>
  median(range(Math.round(size / 2), size).filter((y) => {
    const hu = huAt(slice, size, size / 2, y);
    return hu > 150 && hu < 350;
  }));

describe("EVAR phantom", () => {
  it("ships more than one case, each with its own anatomy", () => {
    expect(EVAR_CASES.length).toBeGreaterThanOrEqual(2);
    const refs = EVAR_CASES.map((c) => referenceFor(c));
    expect(refs[0]).not.toEqual(refs[1]);
  });

  it("puts contrast-filled lumen at the aortic centre on a neck slice", () => {
    const evarCase = EVAR_CASES[0];
    const z = evarCase.lowestRenalSlice + 2;
    const { x, y } = evarCase.centreAt(z);
    const slice = sliceHU(evarCase, z);
    expect(slice).toHaveLength(evarCase.size * evarCase.size);
    expect(huAt(slice, evarCase.size, x, y)).toBeGreaterThan(250);
  });

  it("leaves air outside the body", () => {
    const evarCase = EVAR_CASES[0];
    const slice = sliceHU(evarCase, 10);
    expect(huAt(slice, evarCase.size, 1, 1)).toBeLessThan(-900);
  });

  it("draws the outer wall at the radius the reference is built from", () => {
    const evarCase = EVAR_CASES[0];
    const z = evarCase.lowestRenalSlice + 2;
    const { x, y } = evarCase.centreAt(z);
    const radiusPx = outerRadiusMm(evarCase, z) / evarCase.pixelMm;
    const slice = sliceHU(evarCase, z);
    expect(huAt(slice, evarCase.size, x + radiusPx - 1, y)).toBeGreaterThan(0);
    expect(huAt(slice, evarCase.size, x + radiusPx + 3, y)).toBeLessThan(0);
  });

  it("is deterministic, so the same slice always looks the same", () => {
    const evarCase = EVAR_CASES[1];
    expect(sliceHU(evarCase, 40)).toEqual(sliceHU(evarCase, 40));
  });

  it("splits into two iliacs below the bifurcation", () => {
    const evarCase = EVAR_CASES[0];
    const z = evarCase.bifurcationSlice + 8;
    const slice = sliceHU(evarCase, z);
    const { right, left } = evarCase.iliacCentresAt(z);
    expect(huAt(slice, evarCase.size, right.x, right.y)).toBeGreaterThan(250);
    expect(huAt(slice, evarCase.size, left.x, left.y)).toBeGreaterThan(250);
    expect(right.x).toBeLessThan(left.x);
  });

  it("derives every reference from the geometry", () => {
    const evarCase = EVAR_CASES[0];
    const ref = referenceFor(evarCase);
    expect(ref.neckDiameter).toBeCloseTo(evarCase.neckRadiusMm * 2);
    expect(ref.maxSac).toBeCloseTo(evarCase.sacRadiusMm * 2, 0);
    expect(ref.rightCia).toBeCloseTo(evarCase.ciaRadiusMm.right * 2);
    expect(ref.leftCia).toBeCloseTo(evarCase.ciaRadiusMm.left * 2);
    expect(ref.neckLength).toBe(
      (ref.sacStartSlice - evarCase.lowestRenalSlice) * evarCase.sliceMm,
    );
  });

  it("has a hostile case: a wide, short neck and an ectatic right iliac", () => {
    const hostile = EVAR_CASES.find((c) => c.id === "hostile-neck")!;
    const ref = referenceFor(hostile);
    expect(ref.neckDiameter).toBeCloseTo(30);
    expect(ref.neckLength).toBe(10);
    expect(ref.rightCia).toBeCloseTo(24);
    expect(ref.leftCia).toBeLessThan(ref.rightCia);
  });

  it("starts the sac where the diameter first passes 110% of the neck", () => {
    const evarCase = EVAR_CASES[1];
    const { sacStartSlice } = referenceFor(evarCase);
    const neck = evarCase.neckRadiusMm;
    expect(outerRadiusMm(evarCase, sacStartSlice)).toBeGreaterThan(neck * 1.1);
    expect(outerRadiusMm(evarCase, sacStartSlice - 1)).toBeLessThanOrEqual(
      neck * 1.1,
    );
  });

  it("names every case once, and gives each its own answers", () => {
    expect(new Set(EVAR_CASES.map((c) => c.id)).size).toBe(EVAR_CASES.length);
    expect(new Set(EVAR_CASES.map((c) => c.title)).size).toBe(EVAR_CASES.length);
    const refs = EVAR_CASES.map((c) => JSON.stringify(referenceFor(c)));
    expect(new Set(refs).size).toBe(EVAR_CASES.length);
  });

  describe("reads like an abdominal CTA", () => {
    it("has a faintly enhanced IVC on the patient's right of the aorta, and nothing like it on the left", () => {
      EVAR_CASES.forEach((c) => {
        const z = c.bifurcationSlice - 3;
        const slice = sliceHU(c, z);
        const { x, y } = c.centreAt(z);
        const aortaPx = outerRadiusMm(c, z) / c.pixelMm;
        const rows = { y0: y - 40, y1: y + 60 };
        const patientRight = countIn(slice, c.size, { ...rows, x0: x - aortaPx - 45, x1: x - aortaPx - 2 }, 80, 160);
        const patientLeft = countIn(slice, c.size, { ...rows, x0: x + aortaPx + 2, x1: x + aortaPx + 45 }, 80, 160);
        expect(patientRight, c.id).toBeGreaterThan(120);
        expect(patientLeft, c.id).toBeLessThan(40);
      });
    });

    it("has psoas muscle either side of the vertebral body low in the abdomen", () => {
      const c = EVAR_CASES[0];
      const slice = sliceHU(c, c.slices - 1);
      const y = spineRow(slice, c.size);
      [-1, 1].forEach((side) => {
        const outward = range(1, 120).map((step) => huAt(slice, c.size, c.size / 2 + side * step, y));
        const pastBone = outward.slice(outward.findIndex((hu) => hu <= 120));
        expect(pastBone.slice(0, 12).filter((hu) => hu >= 0 && hu <= 110).length).toBeGreaterThanOrEqual(8);
      });
    });

    it("has bone behind the spinal canal, not just a round vertebral body", () => {
      const c = EVAR_CASES[0];
      const slice = sliceHU(c, 60);
      const down = range(spineRow(slice, c.size), c.size).map((y) => huAt(slice, c.size, c.size / 2, y));
      const canalStart = down.findIndex((hu) => hu >= -30 && hu <= 60);
      const canal = down.slice(canalStart);
      const canalEnd = canal.findIndex((hu) => hu < -30 || hu > 60);
      expect(canalEnd).toBeGreaterThanOrEqual(8);
      expect(Math.max(...canal.slice(canalEnd, canalEnd + 6))).toBeGreaterThan(300);
    });

    it("has a liver on the patient's right at the top of the stack, gone by the pelvis", () => {
      const c = EVAR_CASES[0];
      const half = c.size / 2;
      const imbalance = (z: number) => {
        const slice = sliceHU(c, z);
        const solid = (x0: number, x1: number) => countIn(slice, c.size, { x0, x1, y0: 0, y1: c.size }, 55, 110);
        return solid(0, half) - solid(half, c.size);
      };
      expect(imbalance(0)).toBeGreaterThan(5000);
      expect(Math.abs(imbalance(c.slices - 1))).toBeLessThan(2000);
    });

    it("has a spleen on the patient's left up top, smaller than the liver", () => {
      const c = EVAR_CASES[0];
      const half = c.size / 2;
      const slice = sliceHU(c, 0);
      const solid = (x0: number, x1: number) => countIn(slice, c.size, { x0, x1, y0: 0, y1: c.size * 0.6 }, 85, 160);
      expect(solid(half + 60, c.size)).toBeGreaterThan(1500);
      expect(countIn(sliceHU(c, c.slices - 1), c.size, { x0: half + 60, x1: c.size, y0: 0, y1: c.size * 0.6 }, 85, 160)).toBeLessThan(200);
    });

    it("shows the kidneys in the arterial phase: bright cortex, darker medulla, fat in the sinus", () => {
      const c = EVAR_CASES[0];
      const z = c.lowestRenalSlice - 2;
      const slice = sliceHU(c, z);
      const kidneyRow = Math.round(c.size * 0.61);
      // The patient's left kidney, on the image's right, walked from its outer edge in toward the spine.
      const inward = range(0, 70).map((step) => huAt(slice, c.size, c.size - 40 - step, kidneyRow));
      const start = inward.findIndex((hu) => hu > 140);
      const kidney = inward.slice(start, start + 40);
      expect(Math.max(...kidney.slice(0, 8))).toBeGreaterThan(170);
      expect(kidney.slice(8, 20).some((hu) => hu > 70 && hu < 140)).toBe(true);
      expect(kidney.some((hu) => hu < -40)).toBe(true);
    });

    it("has gas in the bowel", () => {
      EVAR_CASES.forEach((c) => {
        const slice = sliceHU(c, 50);
        const middle = { x0: c.size * 0.3, x1: c.size * 0.7, y0: c.size * 0.32, y1: c.size * 0.5 };
        expect(countIn(slice, c.size, middle, -1100, -500), c.id).toBeGreaterThan(30);
      });
    });

    it("lies on a scanner table", () => {
      const c = EVAR_CASES[0];
      const slice = sliceHU(c, 40);
      const column = range(Math.round(c.size * 0.6), c.size).map((y) => huAt(slice, c.size, c.size / 2, y) > -500);
      const solidRuns = column.filter((solid, i) => solid && !column[i - 1]).length;
      expect(solidRuns).toBeGreaterThanOrEqual(2);
    });

    it("has grainy noise, so neighbouring pixels move together", () => {
      const c = EVAR_CASES[0];
      const pairs = range(c.lowestRenalSlice + 1, c.lowestRenalSlice + 7).flatMap((z) => {
        const slice = sliceHU(c, z);
        const { x, y } = c.centreAt(z);
        return range(-4, 5).flatMap((dy) =>
          range(-4, 4).map((dx) => [huAt(slice, c.size, x + dx, y + dy), huAt(slice, c.size, x + dx + 1, y + dy)]),
        );
      });
      const mean = pairs.reduce((sum, [a]) => sum + a, 0) / pairs.length;
      const cov = pairs.reduce((sum, [a, b]) => sum + (a - mean) * (b - mean), 0) / pairs.length;
      const variance = pairs.reduce((sum, [a]) => sum + (a - mean) ** 2, 0) / pairs.length;
      expect(cov / variance).toBeGreaterThan(0.3);
      expect(Math.sqrt(variance)).toBeGreaterThan(5);
    });

    it("blurs the lumen edge into the wall, the way partial volume does", () => {
      const c = EVAR_CASES[0];
      const z = c.lowestRenalSlice + 2;
      const slice = sliceHU(c, z);
      const { x, y } = c.centreAt(z);
      const radiusPx = outerRadiusMm(c, z) / c.pixelMm;
      const outward = range(0, Math.ceil(radiusPx) + 2).map((step) => huAt(slice, c.size, x + step, y));
      const edge = outward.findIndex((hu) => hu < 100);
      expect(outward.slice(0, edge + 1).some((hu) => hu > 100 && hu < 280)).toBe(true);
    });
  });
});
