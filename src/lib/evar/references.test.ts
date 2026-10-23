import { describe, it, expect } from "vitest";
import { EVAR_CASES, referenceFor } from "./phantom";
import { referenceForCase, referencesResponseSchema } from "./references";
import manifest from "../../../public/evar/scans/manifest.json";
import { parseManifest } from "./scans";

const [realScan] = parseManifest(manifest, "/evar/scans");

const longNeck = EVAR_CASES[0];

const override = {
  caseId: longNeck.id,
  neckDiameter: 25.5,
  neckLength: 28,
  maxSac: 61,
  rightCia: 14,
  leftCia: 12.5,
  note: "Re-measured on a centerline",
  updatedAt: "2026-10-22T10:00:00.000Z",
};

describe("referenceForCase", () => {
  it("is the phantom geometry when nobody has set the case by hand", () => {
    expect(referenceForCase(longNeck, [])).toEqual(referenceFor(longNeck));
  });

  it("ignores overrides for other cases", () => {
    expect(referenceForCase(longNeck, [{ ...override, caseId: "short-neck" }])).toEqual(referenceFor(longNeck));
  });

  it("takes all five scored values from the override and keeps the phantom's sac start slice", () => {
    expect(referenceForCase(longNeck, [override])).toEqual({
      neckDiameter: 25.5,
      neckLength: 28,
      maxSac: 61,
      rightCia: 14,
      leftCia: 12.5,
      sacStartSlice: referenceFor(longNeck).sacStartSlice,
    });
  });
});

describe("referenceForCase on a real scan", () => {
  it("has no answer until someone sets one, since there's no geometry to fall back on", () => {
    expect(referenceForCase(realScan, [])).toBeNull();
  });

  it("is exactly the five values set by hand once there are some", () => {
    expect(referenceForCase(realScan, [{ ...override, caseId: realScan.id }])).toEqual({
      neckDiameter: 25.5,
      neckLength: 28,
      maxSac: 61,
      rightCia: 14,
      leftCia: 12.5,
    });
  });
});

describe("referencesResponseSchema", () => {
  it("reads the API's list", () => {
    expect(referencesResponseSchema.parse({ references: [override] }).references[0].note).toBe(
      "Re-measured on a centerline",
    );
  });
});
