/**
 * Synthetic abdominal CTA phantoms for practising EVAR sizing.
 *
 * Each case is a handful of numbers (neck and sac radii, where the renals and
 * the bifurcation sit) and a function that draws any axial slice from them in
 * Hounsfield units. Nothing is stored, so a case costs nothing until a slice is
 * looked at, and every reference value is exact because it comes from the same
 * numbers the image does.
 *
 * `sliceHU(case, z)` is the only thing the viewer needs. A real deidentified
 * CTA stack can stand in later by answering the same question.
 */

import type { Point, Reference } from "./measure";

type CaseParams = {
  id: string;
  title: string;
  blurb: string;
  debrief: string;
  neckRadiusMm: number;
  sacRadiusMm: number;
  ciaRadiusMm: { right: number; left: number };
  lowestRenalSlice: number;
  /** How many slices above the lowest renal the other renal comes off. */
  otherRenalAbove: number;
  /** Last slice of the straight neck, where the sac starts to flare. */
  neckEndSlice: number;
  sacPeakSlice: number;
  bifurcationSlice: number;
  /** Side-to-side wander of the aorta, in pixels, so it isn't a ruler-straight tube. */
  driftPx: number;
  seed: number;
};

export type EvarCase = CaseParams & {
  size: number;
  pixelMm: number;
  sliceMm: number;
  slices: number;
  centreAt: (z: number) => Point;
  iliacCentresAt: (z: number) => { right: Point; left: Point };
};

const SIZE = 384;
const PIXEL_MM = 0.85;
const SLICE_MM = 2;
const SLICES = 100;
const WALL_MM = 1.5;
const RENAL_RADIUS_MM = 3;

const BODY = { x: 192, y: 205, rx: 165, ry: 125 };
const SPINE = { x: 192, y: 282, r: 25 };
const CANAL = { x: 192, y: 322, r: 10 };
const VISCERA = { x: 192, y: 150, rx: 115, ry: 55 };

const HU = {
  air: -1000,
  fat: -90,
  soft: 35,
  wall: 70,
  thrombus: 45,
  lumen: 360,
  calcium: 750,
  cortex: 650,
  marrow: 230,
  kidney: 170,
  csf: 15,
};

const smoothstep = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

const insideEllipse = (x: number, y: number, e: { x: number; y: number; rx: number; ry: number }) =>
  ((x - e.x) / e.rx) ** 2 + ((y - e.y) / e.ry) ** 2 <= 1;

/** Small, fast, seeded PRNG so the noise is the same every time a slice is drawn. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Outer-wall radius of the aorta at a slice, in mm: a straight neck, a smooth
 * flare into the sac, then a taper down to the bifurcation. Below the
 * bifurcation there is no aorta, so it's zero.
 */
export function outerRadiusMm(c: CaseParams, z: number): number {
  if (z >= c.bifurcationSlice) return 0;
  if (z <= c.neckEndSlice) return c.neckRadiusMm;
  if (z <= c.sacPeakSlice) {
    const t = (z - c.neckEndSlice) / (c.sacPeakSlice - c.neckEndSlice);
    return c.neckRadiusMm + (c.sacRadiusMm - c.neckRadiusMm) * smoothstep(t);
  }
  const t = (z - c.sacPeakSlice) / (c.bifurcationSlice - c.sacPeakSlice);
  const end = c.neckRadiusMm * 0.9;
  return c.sacRadiusMm - (c.sacRadiusMm - end) * smoothstep(t);
}

function makeCase(params: CaseParams): EvarCase {
  const driftAt = (z: number) => params.driftPx * Math.sin(z / 18);

  // The posterior wall rests on the vertebral body, so a bigger sac pushes the
  // centre forward rather than through the spine.
  const centreAt = (z: number): Point => {
    const radiusPx = outerRadiusMm(params, Math.min(z, params.bifurcationSlice - 1)) / PIXEL_MM;
    return { x: SPINE.x + 20 + driftAt(z), y: SPINE.y - SPINE.r - radiusPx - 2 };
  };

  const iliacCentresAt = (z: number) => {
    const origin = centreAt(params.bifurcationSlice - 1);
    const below = Math.max(0, z - params.bifurcationSlice) * SLICE_MM;
    const spread = 8 + below * 0.55;
    const y = origin.y + below * 0.2;
    return {
      // Radiological convention: the patient's right is on the image's left.
      right: { x: origin.x - spread, y },
      left: { x: origin.x + spread, y },
    };
  };

  return {
    ...params,
    size: SIZE,
    pixelMm: PIXEL_MM,
    sliceMm: SLICE_MM,
    slices: SLICES,
    centreAt,
    iliacCentresAt,
  };
}

export const EVAR_CASES: readonly EvarCase[] = [
  makeCase({
    id: "long-neck",
    title: "Long straight neck",
    blurb: "A textbook infrarenal aneurysm with a long, parallel neck and modest iliacs.",
    debrief:
      "Comfortably inside the usual instructions for use: a neck well over 15 mm long and under 32 mm wide, and iliacs that will take a standard limb.",
    neckRadiusMm: 11.5,
    sacRadiusMm: 29,
    ciaRadiusMm: { right: 7, left: 6.5 },
    lowestRenalSlice: 30,
    otherRenalAbove: 3,
    neckEndSlice: 39,
    sacPeakSlice: 58,
    bifurcationSlice: 78,
    driftPx: 3,
    seed: 11,
  }),
  makeCase({
    id: "short-neck",
    title: "Short neck, wide right iliac",
    blurb: "A bigger sac that flares almost straight off the renals, with an ectatic right common iliac.",
    debrief:
      "The neck is shorter than the 15 mm most devices ask for, and the right common iliac is wide enough to need a flared limb or an iliac branch. This is the case where measuring carefully changes the plan.",
    neckRadiusMm: 13,
    sacRadiusMm: 34,
    ciaRadiusMm: { right: 10, left: 7.5 },
    lowestRenalSlice: 34,
    otherRenalAbove: 2,
    neckEndSlice: 35,
    sacPeakSlice: 52,
    bifurcationSlice: 74,
    driftPx: 8,
    seed: 23,
  }),
  makeCase({
    id: "hostile-neck",
    title: "Hostile neck",
    blurb: "A wide neck that only runs a centimetre before the sac, a big aneurysm, and a right common iliac that's nearly aneurysmal itself.",
    debrief:
      "A 30 mm neck sits at the top of the range a standard main body covers, and 10 mm is about the shortest landing zone current devices accept at all. The 24 mm right iliac needs the widest limb on the sizing sheet. Small measuring errors here move you from one device to another, or off the sheet entirely.",
    neckRadiusMm: 15,
    sacRadiusMm: 35,
    ciaRadiusMm: { right: 12, left: 6 },
    lowestRenalSlice: 34,
    otherRenalAbove: 2,
    neckEndSlice: 36,
    sacPeakSlice: 52,
    bifurcationSlice: 72,
    driftPx: 10,
    seed: 37,
  }),
  makeCase({
    id: "small-sac",
    title: "Small sac, long neck",
    blurb: "A modest aneurysm under a long, narrow neck, with iliacs a millimetre apart.",
    debrief:
      "At 52 mm the sac sits between the usual thresholds for repair, 55 mm in men and 50 mm in women, so whether to fix it at all is the real question. If you do, a 20 mm neck takes the smallest main body on the sheet, and the 12 and 11 mm iliacs fall either side of a limb boundary.",
    neckRadiusMm: 10,
    sacRadiusMm: 26,
    ciaRadiusMm: { right: 6, left: 5.5 },
    lowestRenalSlice: 28,
    otherRenalAbove: 2,
    neckEndSlice: 40,
    sacPeakSlice: 60,
    bifurcationSlice: 80,
    driftPx: 2,
    seed: 41,
  }),
  makeCase({
    id: "wide-sac",
    title: "Wide sac, generous neck",
    blurb: "A big but simple aneurysm under a long, parallel neck.",
    debrief:
      "A 25 mm neck runs well past the 15 mm devices ask for and takes a 28 mm main body. Both iliacs land in the same limb band, so the size of the sac is the only thing that looks frightening here, and it doesn't change the device.",
    neckRadiusMm: 12.5,
    sacRadiusMm: 32,
    ciaRadiusMm: { right: 8, left: 7.5 },
    lowestRenalSlice: 32,
    otherRenalAbove: 3,
    neckEndSlice: 42,
    sacPeakSlice: 60,
    bifurcationSlice: 80,
    driftPx: 4,
    seed: 53,
  }),
  makeCase({
    id: "narrow-iliacs",
    title: "Narrow iliacs",
    blurb: "An easy neck above small common iliacs on both sides.",
    debrief:
      "The neck is the easy part. At 9 and 10 mm the iliacs need the two narrowest limbs on the sheet, and iliacs this small usually mean small external iliacs too, so getting an 18 Fr main body up them becomes the question. A millimetre either way changes the limb.",
    neckRadiusMm: 11,
    sacRadiusMm: 29,
    ciaRadiusMm: { right: 4.5, left: 5 },
    lowestRenalSlice: 30,
    otherRenalAbove: 2,
    neckEndSlice: 40,
    sacPeakSlice: 62,
    bifurcationSlice: 80,
    driftPx: 5,
    seed: 67,
  }),
  makeCase({
    id: "ectatic-left",
    title: "Wide left iliac",
    blurb: "A straightforward neck and sac, with the wide common iliac on the left this time.",
    debrief:
      "The short neck case's iliac problem on the other side. The 19 mm left common iliac takes a 24 mm limb and the 13 mm right a 16. Which side the main body goes up decides which leg the wide limb belongs on, so check the device picker agrees with the side you chose.",
    neckRadiusMm: 12,
    sacRadiusMm: 30,
    ciaRadiusMm: { right: 6.5, left: 9.5 },
    lowestRenalSlice: 32,
    otherRenalAbove: 3,
    neckEndSlice: 40,
    sacPeakSlice: 56,
    bifurcationSlice: 76,
    driftPx: 6,
    seed: 79,
  }),
  makeCase({
    id: "short-wide",
    title: "Short, wide neck",
    blurb: "A 28 mm neck that only just falls short of the usual landing length, over a big sac.",
    debrief:
      "Fourteen millimetres of neck is just under the 15 most devices want, and at 28 mm wide it takes a 32 mm main body. It's the kind of neck that tempts you to call it close enough. The 22 mm left iliac needs a 24 mm limb.",
    neckRadiusMm: 14,
    sacRadiusMm: 37,
    ciaRadiusMm: { right: 8, left: 11 },
    lowestRenalSlice: 34,
    otherRenalAbove: 2,
    neckEndSlice: 38,
    sacPeakSlice: 54,
    bifurcationSlice: 74,
    driftPx: 9,
    seed: 83,
  }),
  makeCase({
    id: "giant-sac",
    title: "Giant sac, wide iliacs",
    blurb: "An 8 cm aneurysm that pushes everything aside, over two wide common iliacs.",
    debrief:
      "An 80 mm sac shoves the IVC and the bowel out of its way. The neck is only just long enough at 16 mm, and both common iliacs need the 28 mm limb, the widest on the sheet. Any wider and they'd need an iliac branch device, or the internal iliac coiled and the limb taken down into the external.",
    neckRadiusMm: 13.5,
    sacRadiusMm: 40,
    ciaRadiusMm: { right: 11.5, left: 12.5 },
    lowestRenalSlice: 32,
    otherRenalAbove: 3,
    neckEndSlice: 37,
    sacPeakSlice: 54,
    bifurcationSlice: 70,
    driftPx: 10,
    seed: 97,
  }),
];

/**
 * Draws one vessel cross-section: outer wall, thrombus, and an eccentric
 * contrast lumen pushed toward the front, the way thrombus usually lines the
 * back of a sac.
 */
function vesselHU(dx: number, dy: number, outerPx: number, neckPx: number, z: number): number | null {
  const d = Math.hypot(dx, dy);
  if (d > outerPx) return null;
  const wallPx = WALL_MM / PIXEL_MM;
  const lumenPx = Math.min(outerPx - wallPx, neckPx - wallPx);
  const shift = (outerPx - wallPx - lumenPx) * 0.6;
  if (Math.hypot(dx, dy + shift) <= lumenPx) return HU.lumen;
  if (d > outerPx - wallPx) {
    const angle = Math.atan2(dy, dx);
    return Math.sin(angle * 7 + z * 0.3) > 0.97 ? HU.calcium : HU.wall;
  }
  return HU.thrombus;
}

function backgroundHU(c: EvarCase, x: number, y: number, z: number): number {
  if (!insideEllipse(x, y, BODY)) return HU.air;
  const innerBody = { ...BODY, rx: BODY.rx - 14, ry: BODY.ry - 12 };
  if (!insideEllipse(x, y, innerBody)) return HU.soft;

  const spineD = Math.hypot(x - SPINE.x, y - SPINE.y);
  if (spineD <= SPINE.r) return spineD > SPINE.r - 3 ? HU.cortex : HU.marrow;
  if (Math.hypot(x - CANAL.x, y - CANAL.y) <= CANAL.r) return HU.csf;

  const kidneyMid = c.lowestRenalSlice - 2;
  const kidneyHalf = 22;
  const kz = (z - kidneyMid) / kidneyHalf;
  if (Math.abs(kz) < 1) {
    const scale = Math.sqrt(1 - kz * kz);
    const kidney = { y: 245, rx: 24 * scale, ry: 36 * scale };
    if (insideEllipse(x, y, { ...kidney, x: SPINE.x - 88 }) || insideEllipse(x, y, { ...kidney, x: SPINE.x + 88 })) {
      return HU.kidney;
    }
  }

  if (insideEllipse(x, y, VISCERA)) return HU.soft;
  return HU.fat;
}

/** Bright band running out to a kidney, if this slice cuts through a renal artery. */
function renalHU(c: EvarCase, x: number, y: number, z: number): number | null {
  const centre = c.centreAt(z);
  const renals = [
    { slice: c.lowestRenalSlice, side: -1 },
    { slice: c.lowestRenalSlice - c.otherRenalAbove, side: 1 },
  ];
  for (const renal of renals) {
    const dz = Math.abs(z - renal.slice) * SLICE_MM;
    if (dz > RENAL_RADIUS_MM) continue;
    const halfPx = Math.sqrt(RENAL_RADIUS_MM ** 2 - dz ** 2) / PIXEL_MM;
    const towardKidney = (x - centre.x) * renal.side;
    if (towardKidney > 0 && towardKidney < 75 && Math.abs(y - centre.y) <= halfPx) {
      return HU.lumen;
    }
  }
  return null;
}

/** One axial slice in Hounsfield units, row-major, `size * size` long. */
export function sliceHU(c: EvarCase, z: number): Int16Array {
  const out = new Int16Array(SIZE * SIZE);
  const random = mulberry32(c.seed * 7919 + z);
  const neckPx = c.neckRadiusMm / PIXEL_MM;
  const aortaPx = outerRadiusMm(c, z) / PIXEL_MM;
  const centre = c.centreAt(z);
  const iliacs = c.iliacCentresAt(z);
  const iliacPx = { right: c.ciaRadiusMm.right / PIXEL_MM, left: c.ciaRadiusMm.left / PIXEL_MM };

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      let hu: number | null = null;
      if (aortaPx > 0) {
        hu = vesselHU(x - centre.x, y - centre.y, aortaPx, neckPx, z);
      } else {
        hu =
          vesselHU(x - iliacs.right.x, y - iliacs.right.y, iliacPx.right, iliacPx.right, z) ??
          vesselHU(x - iliacs.left.x, y - iliacs.left.y, iliacPx.left, iliacPx.left, z);
      }
      hu ??= renalHU(c, x, y, z) ?? backgroundHU(c, x, y, z);
      const noise = hu === HU.air ? 0 : (random() - 0.5) * 24;
      out[y * SIZE + x] = Math.round(hu + noise);
    }
  }
  return out;
}

/**
 * Exact answers for a case. The sac "starts" at the first slice whose diameter
 * is more than 10% over the neck, which is the usual working definition of
 * where the landing zone ends.
 */
export function referenceFor(c: EvarCase): Reference & { sacStartSlice: number } {
  const zs = Array.from({ length: c.bifurcationSlice }, (_, z) => z);
  const sacStartSlice =
    zs.find((z) => z > c.lowestRenalSlice && outerRadiusMm(c, z) > c.neckRadiusMm * 1.1) ?? c.bifurcationSlice;
  const maxRadius = Math.max(...zs.map((z) => outerRadiusMm(c, z)));
  return {
    neckDiameter: c.neckRadiusMm * 2,
    neckLength: (sacStartSlice - c.lowestRenalSlice) * c.sliceMm,
    maxSac: maxRadius * 2,
    rightCia: c.ciaRadiusMm.right * 2,
    leftCia: c.ciaRadiusMm.left * 2,
    sacStartSlice,
  };
}
