/**
 * Gore Excluder Conformable sizing, transcribed from the IFU the FDA hosts for
 * PMA P200030/S014 (Tables 29 to 31) and the trunk part numbers in its
 * summary. Educational only. Not affiliated with Gore and not for planning a
 * real case; the IFU is the source of truth.
 */

import { exactly, findDevice, lookup, type Band, type Device, type DevicePick, type Sheet, type SheetReach } from "./devices";

/** Table 29: intended aortic vessel diameter to trunk diameter. */
const TRUNK: readonly Band[] = [
  { from: 16, to: 18, graft: 20 },
  { from: 19, to: 21, graft: 23 },
  { from: 22, to: 23, graft: 26 },
  { from: 24, to: 26, graft: 28.5 },
  { from: 27, to: 29, graft: 32 },
  { from: 30, to: 32, graft: 36 },
];

/**
 * Table 30: intended iliac vessel diameter to leg diameter. The sheet writes
 * these to the half millimetre and the edges are shared, so a 13.5 mm iliac
 * can take a 14.5 or a 16. The 10 mm size is an iliac extender only.
 */
const LEG: readonly Band[] = [
  { from: 8, to: 9, graft: 10 },
  { from: 10, to: 11, graft: 12 },
  { from: 12, to: 13.5, graft: 14.5 },
  { from: 13.5, to: 14.5, graft: 16 },
  { from: 14.5, to: 16.5, graft: 18 },
  { from: 16.5, to: 18.5, graft: 20 },
  { from: 18.5, to: 21.5, graft: 23 },
  { from: 21.5, to: 25, graft: 27 },
];

/** The trunk's two-digit diameter in a part number: 28.5 is written 28. */
const partDiameter = (d: number) => String(Math.floor(d));

const trunkFr = (d: number) => (d <= 23 ? 15 : d <= 28.5 ? 16 : 18);

const trunk = (proximal: number, ipsi: 12 | 14.5, cm: number): Device => ({
  code: `CXT${partDiameter(proximal)}${ipsi === 12 ? 12 : 14}${cm}`,
  proximal,
  distal: ipsi,
  lengthMm: cm * 10,
  fr: trunkFr(proximal),
});

/** Every trunk in the FDA summary's Table 1. */
const TRUNKS: readonly Device[] = [
  ...[12, 14, 16].flatMap((cm) => [trunk(20, 12, cm), trunk(20, 14.5, cm)]),
  ...[23, 26, 28.5].flatMap((d) => [12, 14, 16, 18, 20].flatMap((cm) => [trunk(d, 12, cm), trunk(d, 14.5, cm)])),
  ...[32, 36].flatMap((d) => [14, 16, 18, 20].map((cm) => trunk(d, 14.5, cm))),
];

/** Table 30's lengths, which depend on the leg's diameter. */
const LEG_LENGTHS_MM: Readonly<Record<number, readonly number[]>> = {
  12: [100, 120, 140],
  14.5: [100, 120, 140],
  16: [95, 115, 135],
  18: [95, 115, 135],
  20: [95, 115, 135],
  23: [100, 120, 140],
  27: [100, 120, 140],
};

const legFr = (d: number) => (d <= 20 ? 12 : d === 23 ? 14 : 15);

/** No part numbers for legs in the documents I could read, so these are built from the size. */
const leg = (distal: number, lengthMm: number): Device => ({
  code: `GORE-LEG-${distal}-${lengthMm}`,
  proximal: 16,
  distal,
  lengthMm,
  fr: legFr(distal),
});

const LEGS: readonly Device[] = Object.entries(LEG_LENGTHS_MM).flatMap(([d, lengths]) => lengths.map((l) => leg(Number(d), l)));

/** The 7 cm iliac extenders. Footnote 6 lets the 16 to 27 mm legs serve as extenders too. */
const EXTENDERS: readonly Device[] = [10, 12, 14.5].map((distal) => ({
  code: `GORE-EXT-${distal}-70`,
  proximal: 16,
  distal,
  lengthMm: 70,
  fr: 12,
}));

const CATALOGUE: Sheet["catalogue"] = {
  mainBodies: [{ label: "Trunk-ipsilateral leg (CXT)", devices: TRUNKS }],
  contraLimbs: [{ label: "Contralateral legs", devices: LEGS }],
  ipsiExtensions: [
    { label: "Iliac extenders, 7 cm", devices: EXTENDERS },
    { label: "Contralateral legs used as extenders", devices: LEGS.filter((d) => d.distal >= 16) },
  ],
};

/** Every labelled leg and extender length includes a 3 cm overlap. */
const OVERLAP_MM = 30;
/** Table 30 note 2: treatable length counts 5.5 cm of the trunk, or 6.5 on the 32 and 36. */
const trunkRegionMm = (main: Device) => (main.proximal >= 32 ? 65 : 55);

function reachFor(pick: DevicePick): SheetReach {
  const main = findDevice({ catalogue: CATALOGUE }, pick.mainBody);
  if (!main) return { gateMm: null, contra: null, ipsi: null };
  const region = trunkRegionMm(main);
  const contraLeg = findDevice({ catalogue: CATALOGUE }, pick.contraLimb);
  const extension = findDevice({ catalogue: CATALOGUE }, pick.ipsiExtension);
  return {
    gateMm: region + OVERLAP_MM,
    contra: contraLeg ? exactly(region + contraLeg.lengthMm) : null,
    ipsi: exactly(extension ? main.lengthMm + extension.lengthMm - OVERLAP_MM : main.lengthMm),
  };
}

export const EXCLUDER: Sheet = {
  id: "excluder",
  name: "Gore Excluder Conformable",
  maker: "Gore",
  source: "the Gore Excluder Conformable IFU hosted by the FDA (P200030/S014, Tables 29 to 31)",
  codesNote: "Trunk codes (CXT) are Gore's part numbers. Leg and extender codes are built from the table's sizes.",
  mainBodyDiametersFor: (neckMm) => lookup(TRUNK, neckMm),
  limbDiametersFor: (iliacMm) => lookup(LEG, iliacMm, 0.5),
  catalogue: CATALOGUE,
  noIpsiExtension: "None, the trunk's ipsilateral leg seals",
  ipsiSeal: (main, extension) => extension ?? main,
  reachFor,
  distalSealMm: 10,
};
