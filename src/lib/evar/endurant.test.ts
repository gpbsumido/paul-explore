import { describe, it, expect } from "vitest";
import {
  MAIN_BODIES,
  LIMBS,
  EXTENSIONS,
  mainBodyDiameterFor,
  limbDiameterFor,
  gradeDevices,
  gradeLengths,
  reachFor,
  type DevicePick,
} from "./endurant";
import { EVAR_CASES, referenceFor, type Anatomy } from "./phantom";

const longNeck = referenceFor(EVAR_CASES.find((c) => c.id === "long-neck")!);
const shortNeck = referenceFor(EVAR_CASES.find((c) => c.id === "short-neck")!);

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
    const rows = gradeDevices(
      pick({ mainBody: "ETBF3220C145EE", contraLimb: "ETLW1620C93EE", ipsiExtension: "ETLW1624C93EE" }),
      shortNeck,
      {},
    );
    expect(rows.map((r) => r.verdict)).toEqual(["match", "match", "match"]);
  });

  it("seals the ipsilateral side with the main body's own leg when there's no extension", () => {
    const rows = gradeDevices(pick({ mainBody: "ETBF2813C145EE", ipsiExtension: null }), longNeck, {});
    expect(row(rows, "ipsilateral").picked).toBe(13);
    expect(row(rows, "ipsilateral").verdict).toBe("mismatch");
  });

  it("follows the chosen side, so the contralateral limb lands in the other iliac", () => {
    const rows = gradeDevices(pick({ ipsilateral: "left", contraLimb: "ETLW1624C93EE", mainBody: "ETBF3220C145EE" }), shortNeck, {});
    expect(row(rows, "contralateral").expected).toBe(24);
    expect(row(rows, "contralateral").verdict).toBe("match");
    expect(row(rows, "ipsilateral").expected).toBe(20);
  });

  it("says what the table gives for your own measurements too", () => {
    const rows = gradeDevices(pick({ mainBody: "ETBF2516C145EE" }), longNeck, { neckDiameter: 21.4 });
    const main = row(rows, "mainBody");
    expect(main.expected).toBe(28);
    expect(main.fromYours).toBe(25);
    expect(main.verdict).toBe("mismatch");
  });

  it("oversizes a 13 mm iliac to a 16 mm limb, as the sheet does", () => {
    expect(longNeck.leftCia).toBeCloseTo(13);
    const rows = gradeDevices(pick({ ipsilateral: "right", contraLimb: "ETLW1613C93EE" }), longNeck, {});
    expect(row(rows, "contralateral").expected).toBe(16);
    expect(row(rows, "contralateral").verdict).toBe("mismatch");
  });

  it("leaves an unpicked device unpicked", () => {
    const rows = gradeDevices(pick({ mainBody: null, contraLimb: null }), longNeck, {});
    expect(row(rows, "mainBody").verdict).toBe("unpicked");
    expect(row(rows, "contralateral").verdict).toBe("unpicked");
  });
});

describe("reachFor", () => {
  it("reaches limb + 30 to 50 mm on the contralateral side, 10 less on the 124 mm body", () => {
    expect(reachFor(pick({ mainBody: "ETBF2816C145EE", contraLimb: "ETLW1613C93EE" })).contra).toEqual({ min: 123, max: 143 });
    expect(reachFor(pick({ mainBody: "ETBF2816C124EE", contraLimb: "ETLW1613C93EE" })).contra).toEqual({ min: 113, max: 133 });
  });

  it("reaches the main body's own length on the ipsilateral side, or further with an extension overlapping 30 to 50 mm", () => {
    expect(reachFor(pick({ mainBody: "ETBF2816C166EE", ipsiExtension: null })).ipsi).toEqual({ min: 166, max: 166 });
    expect(reachFor(pick({ mainBody: "ETBF2816C145EE", ipsiExtension: "ETEW1313C82EE" })).ipsi).toEqual({ min: 177, max: 197 });
  });

  it("reaches limb + 50 to 70 mm on an Endurant IIs, whose ipsilateral limb is separate", () => {
    expect(reachFor(pick({ mainBody: "ESBF2814C103EE", ipsiExtension: "ETLW1616C93EE" })).ipsi).toEqual({ min: 143, max: 163 });
  });

  it("puts the end of the contralateral gate 80 mm down, or 70 on the 124 mm body", () => {
    expect(reachFor(pick({ mainBody: "ETBF2816C145EE" })).gateMm).toBe(80);
    expect(reachFor(pick({ mainBody: "ETBF2816C124EE" })).gateMm).toBe(70);
    expect(reachFor(pick({ mainBody: null })).gateMm).toBeNull();
  });
});

describe("gradeLengths", () => {
  const anatomy: Anatomy = { renalToBifurcation: 100, renalToInternalIliac: { right: 150, left: 140 } };
  const lengthRow = (rows: ReturnType<typeof gradeLengths>, id: string) => rows.find((r) => r.id === id)!;

  it("passes a side whose reach can end between 15 mm into the common iliac and the internal iliac", () => {
    // Contralateral is the left: window 115 to 140, and limb 93 reaches 123 to 143.
    const rows = gradeLengths(pick({ mainBody: "ETBF2816C145EE", contraLimb: "ETLW1613C93EE" }), anatomy, {});
    expect(lengthRow(rows, "contraReach").window).toEqual({ min: 115, max: 140 });
    expect(lengthRow(rows, "contraReach").verdict).toBe("match");
  });

  it("fails a side that stops short of a seal, or covers the internal iliac", () => {
    const short = gradeLengths(pick({ mainBody: "ESBF2814C103EE", ipsiExtension: null }), anatomy, {});
    expect(lengthRow(short, "ipsiReach").verdict).toBe("mismatch");
    const long = gradeLengths(pick({ contraLimb: "ETLW1613C156EE" }), anatomy, {});
    expect(lengthRow(long, "contraReach").verdict).toBe("mismatch");
  });

  it("fails a gate that ends below the bifurcation, which the 124 mm body can fix", () => {
    const tight: Anatomy = { renalToBifurcation: 76, renalToInternalIliac: { right: 130, left: 130 } };
    expect(lengthRow(gradeLengths(pick({ mainBody: "ETBF2816C145EE" }), tight, {}), "gate").verdict).toBe("mismatch");
    expect(lengthRow(gradeLengths(pick({ mainBody: "ETBF2816C124EE" }), tight, {}), "gate").verdict).toBe("match");
  });

  it("gives the window your own marks imply, when you marked them", () => {
    const rows = gradeLengths(pick(), anatomy, { renalToBifurcation: 96, renalToInternalIliac: { right: 148 } });
    expect(lengthRow(rows, "ipsiReach").fromYours).toEqual({ min: 111, max: 148 });
    expect(lengthRow(rows, "contraReach").fromYours).toBeUndefined();
  });

  it("leaves a side unpicked until something seals it", () => {
    const rows = gradeLengths(pick({ mainBody: null, contraLimb: null }), anatomy, {});
    expect(rows.map((r) => r.verdict)).toEqual(["unpicked", "unpicked", "unpicked"]);
  });
});
