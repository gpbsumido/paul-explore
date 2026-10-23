/**
 * Endurant II/IIs sizing, transcribed from Medtronic's public sizing sheet, so
 * the practice can go one step past the measurements: which device would you
 * pick? Educational only. Not affiliated with Medtronic and not for planning a
 * real case; the IFU and the sheet are the source of truth.
 */

import { exactly, findDevice, lookup, type Band, type Device, type DevicePick, type Reach, type Sheet, type SheetReach } from "./devices";

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

const MAIN_BODIES: readonly Device[] = [
  ...BIFURCATIONS.flatMap(({ proximal, distals, lengths }) =>
    distals.flatMap((distal) => lengths.map((length) => device("ETBF", proximal, distal, length, bodyFr(proximal)))),
  ),
  ...[23, 25, 28, 32, 36].map((proximal) => device("ESBF", proximal, 14, 103, bodyFr(proximal))),
];

const LIMB_LENGTHS = [82, 93, 124, 156, 199];

const LIMBS: readonly Device[] = [10, 13, 16, 20, 24, 28].flatMap((distal) =>
  LIMB_LENGTHS.map((length) => device("ETLW", 16, distal, length, distal <= 16 && length <= 124 ? 14 : 16)),
);

const EXTENSIONS: readonly Device[] = [
  device("ETEW", 10, 10, 82, 14),
  device("ETEW", 13, 13, 82, 14),
  device("ETEW", 20, 20, 82, 16),
  device("ETEW", 24, 24, 82, 16),
  device("ETEW", 28, 28, 82, 18),
];

const CATALOGUE: Sheet["catalogue"] = {
  mainBodies: [
    { label: "Endurant II bifurcated (ETBF)", devices: MAIN_BODIES.filter((d) => d.code.startsWith("ETBF")) },
    { label: "Endurant IIs (ESBF)", devices: MAIN_BODIES.filter((d) => d.code.startsWith("ESBF")) },
  ],
  contraLimbs: [{ label: "Limbs (ETLW)", devices: LIMBS }],
  ipsiExtensions: [
    { label: "Limbs (ETLW)", devices: LIMBS },
    { label: "Iliac extensions (ETEW)", devices: EXTENSIONS },
  ],
};

const byCode = (code: string | null) => findDevice({ catalogue: CATALOGUE }, code);

/** Every overlap the IFU allows when one component sits inside another: 3 to 5 stents. */
const OVERLAP = { min: 30, max: 50 };
/** The sheet's contralateral totals assume the minimum overlap and add 50 mm; the 124 mm body adds 40. */
const CONTRA_ADD = { standard: 50, short: 40 };
/** On an Endurant IIs the ipsilateral limb adds 50 to 70 mm, depending on how many stents overlap. */
const IIS_IPSI_ADD = { min: 50, max: 70 };
/** Distal fixation the IFU asks for in the common iliac. */
const DISTAL_SEAL_MM = 15;

const shortBody = (main: Device) => main.code.startsWith("ETBF") && main.lengthMm === 124;

/**
 * How far each side of a pick reaches down from the top of the main body, as
 * the range overlap allows, and how far down the contralateral gate ends.
 * Taken from the Endurant II/IIs sizing sheet's covered-length footnotes.
 */
function reachFor(pick: DevicePick): SheetReach {
  const main = byCode(pick.mainBody);
  if (!main) return { gateMm: null, contra: null, ipsi: null };
  const add = shortBody(main) ? CONTRA_ADD.short : CONTRA_ADD.standard;
  const contraLimb = byCode(pick.contraLimb);
  const contra: Reach | null = contraLimb
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

export const ENDURANT: Sheet = {
  id: "endurant",
  name: "Medtronic Endurant II/IIs",
  maker: "Medtronic",
  source: "Medtronic's public Endurant II/IIs sizing sheet (US, 12/2020) and the FDA-hosted IFU",
  codesNote: "Codes are Medtronic's own.",
  // The sheet's bands are whole millimetres, so the measurement is rounded first.
  mainBodyDiametersFor: (neckMm) => lookup(PROXIMAL, neckMm),
  limbDiametersFor: (iliacMm) => lookup(DISTAL, iliacMm),
  catalogue: CATALOGUE,
  noIpsiExtension: "None, the main body's leg seals",
  ipsiSeal: (main, extension) => extension ?? main,
  reachFor,
  distalSealMm: DISTAL_SEAL_MM,
};
