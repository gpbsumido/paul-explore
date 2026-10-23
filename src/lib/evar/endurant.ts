/**
 * Endurant II/IIs sizing, transcribed from Medtronic's public sizing sheet, so
 * the practice can go one step past the measurements: which device would you
 * pick? Educational only. Not affiliated with Medtronic and not for planning a
 * real case; the IFU and the sheet are the source of truth.
 */

import type { Attempt, Reference } from "./measure";
import type { Anatomy, MarkedAnatomy } from "./phantom";

type Band = { from: number; to: number; graft: number };

/** Aortic neck diameter (mm) to main-body proximal diameter. */
const PROXIMAL: readonly Band[] = [
  { from: 19, to: 20, graft: 23 },
  { from: 21, to: 22, graft: 25 },
  { from: 23, to: 25, graft: 28 },
  { from: 26, to: 28, graft: 32 },
  { from: 29, to: 32, graft: 36 },
];

/** Common iliac diameter (mm) to limb distal diameter. */
const DISTAL: readonly Band[] = [
  { from: 8, to: 9, graft: 10 },
  { from: 10, to: 11, graft: 13 },
  { from: 12, to: 14, graft: 16 },
  { from: 15, to: 18, graft: 20 },
  { from: 19, to: 22, graft: 24 },
  { from: 23, to: 25, graft: 28 },
];

/** The sheet's bands are whole millimetres, so the measurement is rounded first. */
const lookup = (bands: readonly Band[], mm: number) => {
  const rounded = Math.round(mm);
  return bands.find((b) => rounded >= b.from && rounded <= b.to)?.graft ?? null;
};

export const mainBodyDiameterFor = (neckMm: number) => lookup(PROXIMAL, neckMm);
export const limbDiameterFor = (iliacMm: number) => lookup(DISTAL, iliacMm);

export type Device = {
  code: string;
  proximal: number;
  distal: number;
  lengthMm: number;
  fr: number;
};

const device = (family: string, proximal: number, distal: number, lengthMm: number, fr: number): Device => ({
  code: `${family}${proximal}${distal}C${lengthMm}EE`,
  proximal,
  distal,
  lengthMm,
  fr,
});

const BIFURCATIONS: readonly { proximal: number; distals: number[]; lengths: number[] }[] = [
  { proximal: 23, distals: [13, 16], lengths: [124, 145, 166] },
  { proximal: 25, distals: [13, 16], lengths: [124, 145, 166] },
  { proximal: 28, distals: [13, 16, 20], lengths: [124, 145, 166] },
  { proximal: 32, distals: [16, 20], lengths: [124, 145, 166] },
  { proximal: 36, distals: [16, 20], lengths: [145, 166] },
];

const bodyFr = (proximal: number) => (proximal >= 32 ? 20 : 18);

export const MAIN_BODIES: readonly Device[] = [
  ...BIFURCATIONS.flatMap(({ proximal, distals, lengths }) =>
    distals.flatMap((distal) => lengths.map((length) => device("ETBF", proximal, distal, length, bodyFr(proximal)))),
  ),
  ...[23, 25, 28, 32, 36].map((proximal) => device("ESBF", proximal, 14, 103, bodyFr(proximal))),
];

const LIMB_LENGTHS = [82, 93, 124, 156, 199];

export const LIMBS: readonly Device[] = [10, 13, 16, 20, 24, 28].flatMap((distal) =>
  LIMB_LENGTHS.map((length) => device("ETLW", 16, distal, length, distal <= 16 && length <= 124 ? 14 : 16)),
);

export const EXTENSIONS: readonly Device[] = [
  device("ETEW", 10, 10, 82, 14),
  device("ETEW", 13, 13, 82, 14),
  device("ETEW", 20, 20, 82, 16),
  device("ETEW", 24, 24, 82, 16),
  device("ETEW", 28, 28, 82, 18),
];

const byCode = (code: string | null) =>
  code === null ? null : ([...MAIN_BODIES, ...LIMBS, ...EXTENSIONS].find((d) => d.code === code) ?? null);

export type Side = "right" | "left";

export type DevicePick = {
  ipsilateral: Side;
  mainBody: string | null;
  contraLimb: string | null;
  /** A limb or iliac extension on the main body's own leg; null means the leg seals on its own. */
  ipsiExtension: string | null;
};

export type DeviceGrade = {
  id: "mainBody" | "contralateral" | "ipsilateral";
  label: string;
  /** The code that decided this row, if anything was picked. */
  code: string | null;
  picked: number | null;
  /** What the table gives for the reference anatomy; null means no standard device fits. */
  expected: number | null;
  /**
   * What the table gives for your own measurement, so a wrong pick can be
   * traced to a wrong number. Undefined when you didn't measure it.
   */
  fromYours: number | null | undefined;
  verdict: "match" | "mismatch" | "unpicked";
};

const ciaKey = (side: Side) => (side === "right" ? "rightCia" : "leftCia");
const other = (side: Side): Side => (side === "right" ? "left" : "right");

/**
 * Grades three diameters: the main body's proximal end against the neck, and
 * whatever seals in each common iliac against that iliac. Lengths are graded
 * separately by `gradeLengths`.
 */
export function gradeDevices(pick: DevicePick, reference: Reference, yours: Attempt): DeviceGrade[] {
  const main = byCode(pick.mainBody);
  const contra = byCode(pick.contraLimb);
  const ipsiSeal = byCode(pick.ipsiExtension) ?? main;
  const fromYours = (mm: number | undefined, table: (v: number) => number | null) =>
    mm === undefined ? undefined : table(mm);

  const grade = (
    id: DeviceGrade["id"],
    label: string,
    chosen: Device | null,
    picked: number | null,
    expected: number | null,
    yoursMm: number | undefined,
    table: (v: number) => number | null,
  ): DeviceGrade => ({
    id,
    label,
    code: chosen?.code ?? null,
    picked,
    expected,
    fromYours: fromYours(yoursMm, table),
    verdict: picked === null ? "unpicked" : picked === expected ? "match" : "mismatch",
  });

  const contraSide = ciaKey(other(pick.ipsilateral));
  const ipsiSide = ciaKey(pick.ipsilateral);

  return [
    grade("mainBody", "Main body", main, main?.proximal ?? null, mainBodyDiameterFor(reference.neckDiameter), yours.neckDiameter, mainBodyDiameterFor),
    grade("contralateral", "Contralateral limb", contra, contra?.distal ?? null, limbDiameterFor(reference[contraSide]), yours[contraSide], limbDiameterFor),
    grade("ipsilateral", "Ipsilateral seal", ipsiSeal, ipsiSeal?.distal ?? null, limbDiameterFor(reference[ipsiSide]), yours[ipsiSide], limbDiameterFor),
  ];
}

/** A span of millimetres down the centerline from the lowest renal. */
export type Reach = { min: number; max: number };

/** Every overlap the IFU allows when one component sits inside another: 3 to 5 stents. */
const OVERLAP = { min: 30, max: 50 };
/** The sheet's contralateral totals assume the minimum overlap and add 50 mm; the 124 mm body adds 40. */
const CONTRA_ADD = { standard: 50, short: 40 };
/** On an Endurant IIs the ipsilateral limb adds 50 to 70 mm, depending on how many stents overlap. */
const IIS_IPSI_ADD = { min: 50, max: 70 };
/** Distal fixation the IFU asks for in the common iliac. */
export const DISTAL_SEAL_MM = 15;

const shortBody = (main: Device) => main.code.startsWith("ETBF") && main.lengthMm === 124;
const exactly = (mm: number): Reach => ({ min: mm, max: mm });

/**
 * How far each side of a pick reaches down from the top of the main body, as
 * the range overlap allows, and how far down the contralateral gate ends.
 * Taken from the Endurant II/IIs sizing sheet's covered-length footnotes.
 */
export function reachFor(pick: DevicePick): { gateMm: number | null; contra: Reach | null; ipsi: Reach | null } {
  const main = byCode(pick.mainBody);
  if (!main) return { gateMm: null, contra: null, ipsi: null };
  const add = shortBody(main) ? CONTRA_ADD.short : CONTRA_ADD.standard;
  const contraLimb = byCode(pick.contraLimb);
  const contra = contraLimb
    ? { min: contraLimb.lengthMm + add - (OVERLAP.max - OVERLAP.min), max: contraLimb.lengthMm + add }
    : null;
  const extension = byCode(pick.ipsiExtension);
  const ipsi = main.code.startsWith("ESBF")
    ? extension
      ? { min: extension.lengthMm + IIS_IPSI_ADD.min, max: extension.lengthMm + IIS_IPSI_ADD.max }
      : exactly(main.lengthMm)
    : extension
      ? { min: main.lengthMm + extension.lengthMm - OVERLAP.max, max: main.lengthMm + extension.lengthMm - OVERLAP.min }
      : exactly(main.lengthMm);
  // The minimum overlap above the gate's end is what the sheet's +50 leaves room for.
  return { gateMm: add + OVERLAP.min, contra, ipsi };
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

/** The landing window on one side: past 15 mm of common iliac, short of the internal iliac. */
function sealWindow(toBifurcation: number | undefined, toInternal: number | undefined): Reach | undefined {
  if (toBifurcation === undefined || toInternal === undefined) return undefined;
  return { min: toBifurcation + DISTAL_SEAL_MM, max: toInternal };
}

/**
 * Grades the lengths: the contralateral gate has to end above the aortic
 * bifurcation, and each side has to be able to end in its common iliac, at
 * least 15 mm in and short of the internal iliac.
 */
export function gradeLengths(pick: DevicePick, anatomy: Anatomy, yours: MarkedAnatomy): LengthGrade[] {
  const reach = reachFor(pick);
  const contraSide = other(pick.ipsilateral);
  const grade = (id: LengthGrade["id"], label: string, picked: Reach | null, window: Reach, fromYours: Reach | undefined): LengthGrade => ({
    id,
    label,
    picked,
    window,
    fromYours,
    verdict: picked === null ? "unpicked" : overlaps(picked, window) ? "match" : "mismatch",
  });
  return [
    grade(
      "gate",
      "Gate above the bifurcation",
      reach.gateMm === null ? null : exactly(reach.gateMm),
      { min: 0, max: anatomy.renalToBifurcation },
      yours.renalToBifurcation === undefined ? undefined : { min: 0, max: yours.renalToBifurcation },
    ),
    grade(
      "contraReach",
      "Contralateral reach",
      reach.contra,
      sealWindow(anatomy.renalToBifurcation, anatomy.renalToInternalIliac[contraSide])!,
      sealWindow(yours.renalToBifurcation, yours.renalToInternalIliac?.[contraSide]),
    ),
    grade(
      "ipsiReach",
      "Ipsilateral reach",
      reach.ipsi,
      sealWindow(anatomy.renalToBifurcation, anatomy.renalToInternalIliac[pick.ipsilateral])!,
      sealWindow(yours.renalToBifurcation, yours.renalToInternalIliac?.[pick.ipsilateral]),
    ),
  ];
}
