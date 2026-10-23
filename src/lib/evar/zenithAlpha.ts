/**
 * Cook Zenith Alpha Abdominal sizing, transcribed from Cook's IFU
 * (T_ZALPHA_REV5): Tables 9.5.1 and 9.5.2 for diameters and lengths, and
 * section 10.1.6 for how far a leg overlaps. Educational only. Not affiliated
 * with Cook and not for planning a real case; the IFU is the source of truth.
 */

import { findDevice, lookup, type Band, type Device, type DevicePick, type Sheet, type SheetReach } from "./devices";

/** Table 9.5.1: aortic diameter, rounded to the nearest mm, to main body diameter. */
const MAIN: readonly Band[] = [
  { from: 18, to: 19, graft: 22 },
  { from: 20, to: 21, graft: 24 },
  { from: 22, to: 22, graft: 26 },
  { from: 23, to: 24, graft: 28 },
  { from: 25, to: 26, graft: 30 },
  { from: 27, to: 28, graft: 32 },
  { from: 29, to: 32, graft: 36 },
];

/** Table 9.5.2: iliac diameter, rounded to the nearest mm, to leg diameter. Nothing above 20 mm. */
const LEG: readonly Band[] = [
  { from: 8, to: 8, graft: 9 },
  { from: 9, to: 9, graft: 11 },
  { from: 10, to: 12, graft: 13 },
  { from: 13, to: 15, graft: 16 },
  { from: 16, to: 18, graft: 20 },
  { from: 19, to: 20, graft: 24 },
];

/** Overall length to the contralateral limb, and to the ipsilateral limb, for each main body length. */
const LIMB_ENDS: readonly { contra: number; ipsi: number }[] = [
  { contra: 70, ipsi: 94 },
  { contra: 84, ipsi: 108 },
  { contra: 98, ipsi: 122 },
  { contra: 108, ipsi: 132 },
  { contra: 118, ipsi: 142 },
  { contra: 128, ipsi: 152 },
];

/** Codes are built from the table's sizes; the IFU names the families, ZIMB and ZISL, but not part numbers. */
const MAIN_BODIES: readonly Device[] = [22, 24, 26, 28, 30, 32, 36].flatMap((d) =>
  LIMB_ENDS.map(({ contra, ipsi }) => ({
    code: `ZIMB-${d}-${contra}-${ipsi}`,
    proximal: d,
    distal: 12,
    // Length to the contralateral limb, where the gate ends; the ipsilateral end is in LIMB_ENDS.
    lengthMm: contra,
    fr: d === 36 ? 17 : 16,
  })),
);

/** A leg's overall length is its label plus 28 mm. The two longest labels only come in the three narrowest sizes. */
const LEG_LABELS: Readonly<Record<number, readonly number[]>> = {
  9: [42, 59, 77, 93, 110, 125],
  11: [42, 59, 77, 93, 110, 125],
  13: [42, 59, 77, 93, 110, 125],
  16: [42, 59, 77, 93],
  20: [42, 59, 77, 93],
  24: [42, 59, 77, 93],
};

const LEGS: readonly Device[] = Object.entries(LEG_LABELS).flatMap(([d, labels]) =>
  labels.map((label) => ({
    code: `ZISL-${d}-${label}`,
    proximal: 12,
    distal: Number(d),
    lengthMm: label + 28,
    fr: Number(d) >= 20 ? 14 : 12,
  })),
);

const CATALOGUE: Sheet["catalogue"] = {
  mainBodies: [{ label: "Main bodies (ZIMB)", devices: MAIN_BODIES }],
  contraLimbs: [{ label: "Iliac legs (ZISL)", devices: LEGS }],
  ipsiExtensions: [{ label: "Iliac legs (ZISL)", devices: LEGS }],
};

/** Section 10.1.6: a leg goes 16 to 32 mm into the main body's limb, set by its gold markers. */
const OVERLAP = { min: 16, max: 32 };

const ipsiEndFor = (main: Device) => LIMB_ENDS.find((e) => e.contra === main.lengthMm)?.ipsi ?? main.lengthMm;

function reachFor(pick: DevicePick): SheetReach {
  const main = findDevice({ catalogue: CATALOGUE }, pick.mainBody);
  if (!main) return { gateMm: null, contra: null, ipsi: null };
  const legReach = (limbEnd: number, legCode: string | null) => {
    const leg = findDevice({ catalogue: CATALOGUE }, legCode);
    return leg ? { min: limbEnd + leg.lengthMm - OVERLAP.max, max: limbEnd + leg.lengthMm - OVERLAP.min } : null;
  };
  return {
    gateMm: main.lengthMm,
    contra: legReach(main.lengthMm, pick.contraLimb),
    // Both legs are separate on a Zenith, so nothing seals the ipsilateral side without one.
    ipsi: legReach(ipsiEndFor(main), pick.ipsiExtension),
  };
}

export const ZENITH_ALPHA: Sheet = {
  id: "zenith-alpha",
  name: "Cook Zenith Alpha",
  maker: "Cook",
  source: "Cook's Zenith Alpha Abdominal IFU (T_ZALPHA_REV5, Tables 9.5.1 and 9.5.2, section 10.1.6)",
  codesNote: "ZIMB and ZISL are Cook's family names; the codes after them are built from the table's sizes.",
  mainBodyDiametersFor: (neckMm) => lookup(MAIN, neckMm),
  limbDiametersFor: (iliacMm) => lookup(LEG, iliacMm),
  catalogue: CATALOGUE,
  noIpsiExtension: "Choose an ipsilateral leg",
  ipsiSeal: (_main, extension) => extension,
  reachFor,
  distalSealMm: 10,
};
