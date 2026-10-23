/**
 * Endurant II/IIs sizing, transcribed from Medtronic's public sizing sheet, so
 * the practice can go one step past the measurements: which device would you
 * pick? Educational only. Not affiliated with Medtronic and not for planning a
 * real case; the IFU and the sheet are the source of truth.
 */

import type { Attempt, Reference } from "./measure";

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
 * whatever seals in each common iliac against that iliac. Lengths come from a
 * centerline the axial phantom doesn't model, so they're shown but not graded.
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
