import { describe, it, expect } from "vitest";
import { EVAR_CASES, sliceHU, referenceFor, outerRadiusMm } from "./phantom";

const huAt = (slice: Int16Array, size: number, x: number, y: number) =>
  slice[Math.round(y) * size + Math.round(x)];

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
});
