import { describe, it, expect } from "vitest";
import { EXCLUDER } from "./excluder";
import type { DevicePick } from "./devices";

const pick = (overrides: Partial<DevicePick> = {}): DevicePick => ({
  sheet: "excluder",
  ipsilateral: "right",
  mainBody: "CXT261416",
  contraLimb: null,
  ipsiExtension: null,
  ...overrides,
});

describe("Gore Excluder Conformable", () => {
  it("reads the trunk table, Table 29, rounding the neck to the nearest mm", () => {
    expect(EXCLUDER.mainBodyDiametersFor(16)).toEqual([20]);
    expect(EXCLUDER.mainBodyDiametersFor(21)).toEqual([23]);
    expect(EXCLUDER.mainBodyDiametersFor(25.4)).toEqual([28.5]);
    expect(EXCLUDER.mainBodyDiametersFor(30)).toEqual([36]);
    expect(EXCLUDER.mainBodyDiametersFor(15.4)).toEqual([]);
    expect(EXCLUDER.mainBodyDiametersFor(32.6)).toEqual([]);
  });

  it("reads the leg table, Table 30, where the half-millimetre band edges allow both sizes", () => {
    expect(EXCLUDER.limbDiametersFor(13)).toEqual([14.5]);
    expect(EXCLUDER.limbDiametersFor(13.5)).toEqual([14.5, 16]);
    expect(EXCLUDER.limbDiametersFor(14.5)).toEqual([16, 18]);
    expect(EXCLUDER.limbDiametersFor(22)).toEqual([27]);
    expect(EXCLUDER.limbDiametersFor(25.6)).toEqual([]);
  });

  it("lists the trunks from the FDA summary, by their real part numbers", () => {
    const codes = EXCLUDER.catalogue.mainBodies.flatMap((g) => g.devices.map((d) => d.code));
    expect(codes).toContain("CXT281420");
    expect(codes).toContain("CXT361414");
    expect(codes).not.toContain("CXT321212");
    expect(codes).not.toContain("CXT201218");
  });

  it("reaches 55 mm of trunk plus the leg's label on the contralateral side, 65 on the 32 and 36", () => {
    const leg = EXCLUDER.catalogue.contraLimbs.flatMap((g) => g.devices).find((d) => d.distal === 14.5 && d.lengthMm === 120)!;
    expect(EXCLUDER.reachFor(pick({ contraLimb: leg.code })).contra).toEqual({ min: 175, max: 175 });
    expect(EXCLUDER.reachFor(pick({ mainBody: "CXT321416", contraLimb: leg.code })).contra).toEqual({ min: 185, max: 185 });
  });

  it("reaches the trunk's own length on the ipsilateral side, or 30 mm less than the extender's label further", () => {
    expect(EXCLUDER.reachFor(pick()).ipsi).toEqual({ min: 160, max: 160 });
    const extender = EXCLUDER.catalogue.ipsiExtensions.flatMap((g) => g.devices).find((d) => d.lengthMm === 70)!;
    expect(EXCLUDER.reachFor(pick({ ipsiExtension: extender.code })).ipsi).toEqual({ min: 200, max: 200 });
  });

  it("needs only 10 mm of seal in the iliac", () => {
    expect(EXCLUDER.distalSealMm).toBe(10);
  });
});
