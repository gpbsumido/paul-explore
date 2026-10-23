import { describe, it, expect } from "vitest";
import {
  MAIN_BODIES,
  LIMBS,
  EXTENSIONS,
  mainBodyDiameterFor,
  limbDiameterFor,
  gradeDevices,
  type DevicePick,
} from "./endurant";
import { EVAR_CASES, referenceFor } from "./phantom";

const longNeck = referenceFor(EVAR_CASES.find((c) => c.id === "long-neck")!);

const pick = (overrides: Partial<DevicePick> = {}): DevicePick => ({
  ipsilateral: "right",
  mainBody: "ETBF2816C145EE",
  contraLimb: "ETLW1613C93EE",
  ipsiExtension: null,
  ...overrides,
});

const row = (rows: ReturnType<typeof gradeDevices>, id: string) => rows.find((r) => r.id === id)!;

describe("mainBodyDiameterFor", () => {
  it("reads the proximal table, rounding the neck to the nearest mm", () => {
    expect(mainBodyDiameterFor(19)).toBe(23);
    expect(mainBodyDiameterFor(20.4)).toBe(23);
    expect(mainBodyDiameterFor(22.6)).toBe(28);
    expect(mainBodyDiameterFor(28)).toBe(32);
    expect(mainBodyDiameterFor(32)).toBe(36);
  });

  it("has no standard main body outside 19 to 32 mm", () => {
    expect(mainBodyDiameterFor(18.4)).toBeNull();
    expect(mainBodyDiameterFor(32.6)).toBeNull();
  });
});

describe("limbDiameterFor", () => {
  it("reads the distal table, rounding the iliac to the nearest mm", () => {
    expect(limbDiameterFor(8)).toBe(10);
    expect(limbDiameterFor(11.5)).toBe(16);
    expect(limbDiameterFor(18)).toBe(20);
    expect(limbDiameterFor(25)).toBe(28);
  });

  it("has no standard limb outside 8 to 25 mm", () => {
    expect(limbDiameterFor(7.4)).toBeNull();
    expect(limbDiameterFor(26)).toBeNull();
  });
});

describe("the catalogue", () => {
  it("lists the main bodies on the sheet, and not the ones it leaves out", () => {
    const codes = MAIN_BODIES.map((d) => d.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain("ETBF2816C145EE");
    expect(codes).toContain("ESBF3214C103EE");
    expect(codes).not.toContain("ETBF3620C124EE");
    expect(MAIN_BODIES.find((d) => d.code === "ETBF3216C124EE")!.fr).toBe(20);
  });

  it("sizes limbs and extensions with their sheath", () => {
    expect(LIMBS.find((d) => d.code === "ETLW1613C93EE")!.fr).toBe(14);
    expect(LIMBS.find((d) => d.code === "ETLW1613C156EE")!.fr).toBe(16);
    expect(LIMBS.find((d) => d.code === "ETLW1628C82EE")!.fr).toBe(16);
    expect(EXTENSIONS.find((d) => d.code === "ETEW2828C82EE")!.fr).toBe(18);
  });
});

describe("gradeDevices", () => {
  it("passes picks that match the table for the real anatomy", () => {
    const rows = gradeDevices(pick({ contraLimb: "ETLW1613C93EE", ipsiExtension: "ETLW1616C93EE" }), longNeck, {});
    expect(rows.map((r) => r.verdict)).toEqual(["match", "match", "match"]);
  });

  it("seals the ipsilateral side with the main body's own leg when there's no extension", () => {
    const rows = gradeDevices(pick({ mainBody: "ETBF2813C145EE", ipsiExtension: null }), longNeck, {});
    expect(row(rows, "ipsilateral").picked).toBe(13);
    expect(row(rows, "ipsilateral").verdict).toBe("mismatch");
  });

  it("follows the chosen side, so the contralateral limb lands in the other iliac", () => {
    const rows = gradeDevices(pick({ ipsilateral: "left", contraLimb: "ETLW1616C93EE", mainBody: "ETBF2813C145EE" }), longNeck, {});
    expect(row(rows, "contralateral").expected).toBe(16);
    expect(row(rows, "contralateral").verdict).toBe("match");
    expect(row(rows, "ipsilateral").expected).toBe(13);
  });

  it("says what the table gives for your own measurements too", () => {
    const rows = gradeDevices(pick({ mainBody: "ETBF2516C145EE" }), longNeck, { neckDiameter: 21.4 });
    const main = row(rows, "mainBody");
    expect(main.expected).toBe(28);
    expect(main.fromYours).toBe(25);
    expect(main.verdict).toBe("mismatch");
  });

  it("leaves an unpicked device unpicked", () => {
    const rows = gradeDevices(pick({ mainBody: null, contraLimb: null }), longNeck, {});
    expect(row(rows, "mainBody").verdict).toBe("unpicked");
    expect(row(rows, "contralateral").verdict).toBe("unpicked");
  });
});
