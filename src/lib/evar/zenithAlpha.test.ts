import { describe, it, expect } from "vitest";
import { ZENITH_ALPHA } from "./zenithAlpha";
import type { DevicePick } from "./devices";

const leg = (distal: number, label: number) =>
  ZENITH_ALPHA.catalogue.contraLimbs.flatMap((g) => g.devices).find((d) => d.distal === distal && d.lengthMm === label + 28)!;

const pick = (overrides: Partial<DevicePick> = {}): DevicePick => ({
  sheet: "zenith-alpha",
  ipsilateral: "right",
  mainBody: ZENITH_ALPHA.catalogue.mainBodies[0].devices.find((d) => d.proximal === 28 && d.lengthMm === 84)!.code,
  contraLimb: null,
  ipsiExtension: null,
  ...overrides,
});

describe("Cook Zenith Alpha", () => {
  it("reads the main body table, rounding the neck to the nearest mm", () => {
    expect(ZENITH_ALPHA.mainBodyDiametersFor(18)).toEqual([22]);
    expect(ZENITH_ALPHA.mainBodyDiametersFor(22.4)).toEqual([26]);
    expect(ZENITH_ALPHA.mainBodyDiametersFor(23.6)).toEqual([28]);
    expect(ZENITH_ALPHA.mainBodyDiametersFor(30)).toEqual([36]);
    expect(ZENITH_ALPHA.mainBodyDiametersFor(17.4)).toEqual([]);
  });

  it("reads the leg table, and has no standard leg for an iliac over 20 mm", () => {
    expect(ZENITH_ALPHA.limbDiametersFor(8)).toEqual([9]);
    expect(ZENITH_ALPHA.limbDiametersFor(9)).toEqual([11]);
    expect(ZENITH_ALPHA.limbDiametersFor(12)).toEqual([13]);
    expect(ZENITH_ALPHA.limbDiametersFor(14)).toEqual([16]);
    expect(ZENITH_ALPHA.limbDiametersFor(20)).toEqual([24]);
    expect(ZENITH_ALPHA.limbDiametersFor(21)).toEqual([]);
  });

  it("only makes the longest legs in the three narrowest sizes", () => {
    expect(leg(13, 125)).toBeDefined();
    expect(leg(16, 110)).toBeUndefined();
  });

  it("reaches the main body's limb plus the leg, overlapping 16 to 32 mm, on each side", () => {
    // 84 mm to the contralateral limb, a 59 mm label is 87 mm long.
    expect(ZENITH_ALPHA.reachFor(pick({ contraLimb: leg(13, 59).code })).contra).toEqual({ min: 139, max: 155 });
    // 108 mm to the ipsilateral limb.
    expect(ZENITH_ALPHA.reachFor(pick({ ipsiExtension: leg(16, 42).code })).ipsi).toEqual({ min: 146, max: 162 });
  });

  it("ends the contralateral gate where the main body's contralateral limb ends", () => {
    expect(ZENITH_ALPHA.reachFor(pick()).gateMm).toBe(84);
  });

  it("can't seal the ipsilateral side without a leg, since both legs are separate", () => {
    expect(ZENITH_ALPHA.reachFor(pick()).ipsi).toBeNull();
  });
});
