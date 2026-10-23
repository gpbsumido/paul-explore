/**
 * The sizing sheets the practice knows, and grading a pick against whichever
 * one it came from. Every sheet answers the same questions, so the grading
 * doesn't care whose device it is.
 */

import { findDevice, type Device, type DevicePick, type Reach, type Sheet, type SheetId, type Side } from "./devices";
import { ENDURANT } from "./endurant";
import { EXCLUDER } from "./excluder";
import { ZENITH_ALPHA } from "./zenithAlpha";
import type { Attempt, Reference } from "./measure";
import type { Anatomy, MarkedAnatomy } from "./phantom";

export const SHEETS: Readonly<Record<SheetId, Sheet>> = {
  endurant: ENDURANT,
  excluder: EXCLUDER,
  "zenith-alpha": ZENITH_ALPHA,
};

export type DeviceGrade = {
  id: "mainBody" | "contralateral" | "ipsilateral";
  label: string;
  /** The code that decided this row, if anything was picked. */
  code: string | null;
  picked: number | null;
  /** Every size the table allows for the reference anatomy; empty means no standard device fits. */
  expected: readonly number[];
  /**
   * What the table allows for your own measurement, so a wrong pick can be
   * traced to a wrong number. Undefined when you didn't measure it.
   */
  fromYours: readonly number[] | undefined;
  verdict: "match" | "mismatch" | "unpicked";
};

const ciaKey = (side: Side) => (side === "right" ? "rightCia" : "leftCia");
const other = (side: Side): Side => (side === "right" ? "left" : "right");

/**
 * Grades three diameters against the pick's own sheet: the main body's
 * proximal end against the neck, and whatever seals in each common iliac
 * against that iliac.
 */
export function gradeDevices(pick: DevicePick, reference: Reference, yours: Attempt): DeviceGrade[] {
  const sheet = SHEETS[pick.sheet];
  const main = findDevice(sheet, pick.mainBody);
  const contra = findDevice(sheet, pick.contraLimb);
  const ipsiSeal = sheet.ipsiSeal(main, findDevice(sheet, pick.ipsiExtension));

  const grade = (
    id: DeviceGrade["id"],
    label: string,
    chosen: Device | null,
    picked: number | null,
    referenceMm: number,
    yoursMm: number | undefined,
    table: (mm: number) => readonly number[],
  ): DeviceGrade => {
    const expected = table(referenceMm);
    return {
      id,
      label,
      code: chosen?.code ?? null,
      picked,
      expected,
      fromYours: yoursMm === undefined ? undefined : table(yoursMm),
      verdict: picked === null ? "unpicked" : expected.includes(picked) ? "match" : "mismatch",
    };
  };

  const contraSide = ciaKey(other(pick.ipsilateral));
  const ipsiSide = ciaKey(pick.ipsilateral);

  return [
    grade("mainBody", "Main body", main, main?.proximal ?? null, reference.neckDiameter, yours.neckDiameter, sheet.mainBodyDiametersFor),
    grade("contralateral", "Contralateral limb", contra, contra?.distal ?? null, reference[contraSide], yours[contraSide], sheet.limbDiametersFor),
    grade("ipsilateral", "Ipsilateral seal", ipsiSeal, ipsiSeal?.distal ?? null, reference[ipsiSide], yours[ipsiSide], sheet.limbDiametersFor),
  ];
}

export type LengthGrade = {
  id: "gate" | "contraReach" | "ipsiReach";
  label: string;
  picked: Reach | null;
  /** Where the end has to land for the real anatomy. */
  window: Reach;
  /** Where it would have to land by your own marks; undefined when you didn't mark them. */
  fromYours: Reach | undefined;
  verdict: "match" | "mismatch" | "unpicked";
};

const overlaps = (a: Reach, b: Reach) => a.min <= b.max && b.min <= a.max;

/**
 * Grades the lengths against the pick's own sheet: the contralateral gate has
 * to end above the aortic bifurcation, and each side has to be able to end in
 * its common iliac, at least the sheet's seal length in and short of the
 * internal iliac.
 */
export function gradeLengths(pick: DevicePick, anatomy: Anatomy, yours: MarkedAnatomy): LengthGrade[] {
  const sheet = SHEETS[pick.sheet];
  const reach = sheet.reachFor(pick);
  const contraSide = other(pick.ipsilateral);
  const sealWindow = (toBifurcation: number | undefined, toInternal: number | undefined): Reach | undefined =>
    toBifurcation === undefined || toInternal === undefined ? undefined : { min: toBifurcation + sheet.distalSealMm, max: toInternal };
  const grade = (id: LengthGrade["id"], label: string, picked: Reach | null, window: Reach, fromYours: Reach | undefined): LengthGrade => ({
    id,
    label,
    picked,
    window,
    fromYours,
    verdict: picked === null ? "unpicked" : overlaps(picked, window) ? "match" : "mismatch",
  });
  const gate = reach.gateMm;
  return [
    grade(
      "gate",
      "Gate above the bifurcation",
      gate === null ? null : { min: gate, max: gate },
      { min: 0, max: anatomy.renalToBifurcation },
      yours.renalToBifurcation === undefined ? undefined : { min: 0, max: yours.renalToBifurcation },
    ),
    grade(
      "contraReach",
      "Contralateral reach",
      reach.contra,
      { min: anatomy.renalToBifurcation + sheet.distalSealMm, max: anatomy.renalToInternalIliac[contraSide] },
      sealWindow(yours.renalToBifurcation, yours.renalToInternalIliac?.[contraSide]),
    ),
    grade(
      "ipsiReach",
      "Ipsilateral reach",
      reach.ipsi,
      { min: anatomy.renalToBifurcation + sheet.distalSealMm, max: anatomy.renalToInternalIliac[pick.ipsilateral] },
      sealWindow(yours.renalToBifurcation, yours.renalToInternalIliac?.[pick.ipsilateral]),
    ),
  ];
}
