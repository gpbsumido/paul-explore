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
  /**
   * How far the outer radius grows (positive, a flaring neck) or shrinks
   * (negative, a conical one) between the lowest renal and the end of the neck.
   */
  neckTaperMm: number;
  /**
   * Tilt of the neck away from the sac's axis, and which way the top of it
   * leans on the image: 0° is the patient's left, 90° anterior, 180° the
   * patient's right. Never posterior, where the spine is.
   */
  neckAngle: { deg: number; towardDeg: number };
  /** A crescent of thrombus lining one side of the neck, thickest at `atDeg`. */
  neckThrombus: { atDeg: number; thicknessMm: number } | null;
  /** Arcs of calcified plaque in the wall, centred on `atDeg`, over a run of slices. */
  calcium: readonly { atDeg: number; spanDeg: number; fromSlice: number; toSlice: number }[];
  /** Slice where each internal iliac comes off its common iliac, which is as far as a limb can go. */
  internalIliacSlice: Record<IliacSide, number>;
  seed: number;
};

export type IliacSide = "right" | "left";

/**
 * Distances along the centerline from the lowest renal, in mm: to the aortic
 * bifurcation, and on down each iliac to where its internal iliac comes off.
 */
export type Anatomy = {
  renalToBifurcation: number;
  renalToInternalIliac: Record<IliacSide, number>;
};

/** The same distances from slices someone marked, missing wherever a mark is. */
export type MarkedAnatomy = {
  renalToBifurcation?: number;
  renalToInternalIliac?: Partial<Record<IliacSide, number>>;
};

export type Landmarks = {
  renal: number;
  bifurcation: number;
  rightInternalIliac: number;
  leftInternalIliac: number;
};

export type EvarCase = CaseParams & {
  size: number;
  /** Image direction the neck leans toward, and how stretched an axial cut through it is, at a slice. */
  sectionAt: (z: number) => { toward: Point; stretch: number };
  pixelMm: number;
  sliceMm: number;
  slices: number;
  centreAt: (z: number) => Point;
  iliacCentresAt: (z: number) => { right: Point; left: Point };
  /** Centre of an internal iliac on a slice, or null above where it comes off. */
  internalIliacCentreAt: (z: number, side: IliacSide) => Point | null;
};

const SIZE = 384;
const PIXEL_MM = 0.85;
const SLICE_MM = 2;
/**
 * Room below the bifurcation for a common iliac of about 60 mm along the
 * vessel, which is what a limb lands in. At 100 slices it was closer to 40,
 * shorter than real, and too short for some devices' shortest legs.
 */
const SLICES = 120;
const WALL_MM = 1.5;
const RENAL_RADIUS_MM = 3;
/** Fat between the back of the aorta and the vertebral body, in pixels. */
const SPINE_GAP_PX = 4;
/** Calcified plaque bulges this far in from the wall. */
const PLAQUE_MM = 1;
/** The angled stretch of aorta starts this many slices above the lowest renal. */
const TILT_ABOVE = 8;
/** Slices over which each bend in an angled neck is rounded off. */
const KNEE = 3;
const INTERNAL_ILIAC_RADIUS_MM = 3.5;
/** How fast an internal iliac heads back and outward into the pelvis once it leaves the common iliac, in px per mm down. */
const INTERNAL_ILIAC_DRIFT = { back: 1.0, outward: 1.4 };

const BODY = { x: 192, y: 190, rx: 165, ry: 135 };
/** A lumbar vertebral body, wider than it is deep. */
const SPINE = { x: 192, y: 238, rx: 26, ry: 21 };
const CANAL = { x: 192, y: 268, r: 9 };
const LAMINA_R = 15;
const SPINOUS = { x: 192, y: 290, rx: 5, ry: 13 };
const ERECTOR = { y: 292, dx: 30, rx: 22, ry: 16 };
const VISCERA = { x: 192, y: 140, rx: 115, ry: 55 };
const LIVER = { x: 125, y: 150, rx: 80, ry: 65 };
const SPLEEN = { x: 297, y: 170, rx: 32, ry: 42 };
const KIDNEY = { y: 235, dx: 95, rx: 24, ry: 36 };
const IVC = { rx: 13, ry: 9 };
/** Skin, then subcutaneous fat, then the muscle of the abdominal wall, in pixels in from the outline. */
const LAYERS = { skin: 2, fat: 16, muscle: 24 };
const BOWEL_LOOPS = 9;
/** Spacing of the coarse noise grid. CT noise is grainy rather than per-pixel, and this is what makes it so. */
const GRAIN = 3;

const HU = {
  air: -1000,
  fat: -90,
  soft: 35,
  muscle: 50,
  liver: 70,
  spleen: 110,
  wall: 70,
  thrombus: 45,
  lumen: 360,
  ivc: 115,
  calcium: 750,
  cortex: 650,
  marrow: 230,
  /** Arterial phase: the renal cortex enhances well before the medulla. */
  renalCortex: 190,
  renalMedulla: 110,
  csf: 15,
  bowelFluid: 10,
  table: 200,
  foam: -850,
};

const smoothstep = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

type Ellipse = { x: number; y: number; rx: number; ry: number };

const ellipseQ = (x: number, y: number, e: Ellipse) => ((x - e.x) / e.rx) ** 2 + ((y - e.y) / e.ry) ** 2;

const insideEllipse = (x: number, y: number, e: Ellipse) => ellipseQ(x, y, e) <= 1;

const shrink = (e: Ellipse, by: number): Ellipse => ({ ...e, rx: e.rx - by, ry: e.ry - by });

const SKIN_INNER = shrink(BODY, LAYERS.skin);
const FAT_INNER = shrink(BODY, LAYERS.fat);
const MUSCLE_INNER = shrink(BODY, LAYERS.muscle);
const ERECTORS: readonly Ellipse[] = [-1, 1].map((side) => ({ x: SPINE.x + side * ERECTOR.dx, y: ERECTOR.y, rx: ERECTOR.rx, ry: ERECTOR.ry }));

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
 * Outer-wall radius of the aorta at a slice, in mm: the neck, tapering or
 * flaring from the lowest renal to its end, a smooth flare into the sac, then
 * a taper down to the bifurcation. Below the bifurcation there is no aorta,
 * so it's zero.
 */
export function outerRadiusMm(c: CaseParams, z: number): number {
  if (z >= c.bifurcationSlice) return 0;
  const neckEnd = c.neckRadiusMm + c.neckTaperMm;
  if (z <= c.lowestRenalSlice) return c.neckRadiusMm;
  if (z <= c.neckEndSlice) {
    const t = (z - c.lowestRenalSlice) / Math.max(1, c.neckEndSlice - c.lowestRenalSlice);
    return c.neckRadiusMm + c.neckTaperMm * t;
  }
  if (z <= c.sacPeakSlice) {
    const t = (z - c.neckEndSlice) / (c.sacPeakSlice - c.neckEndSlice);
    return neckEnd + (c.sacRadiusMm - neckEnd) * smoothstep(t);
  }
  const t = (z - c.sacPeakSlice) / (c.bifurcationSlice - c.sacPeakSlice);
  const end = c.neckRadiusMm * 0.9;
  return c.sacRadiusMm - (c.sacRadiusMm - end) * smoothstep(t);
}

/**
 * How steeply the aorta leans at a slice, as sideways mm per mm down: tan θ
 * through the angled stretch, which runs from a little above the renals to
 * the end of the neck, eased in and out over a few slices at each bend.
 */
function tiltAt(c: CaseParams, z: number): number {
  if (c.neckAngle.deg === 0) return 0;
  const top = c.lowestRenalSlice - TILT_ABOVE;
  const upper = smoothstep((z - top) / (2 * KNEE));
  const lower = smoothstep((c.neckEndSlice + 2 * KNEE - z) / (2 * KNEE));
  return Math.tan((c.neckAngle.deg * Math.PI) / 180) * upper * lower;
}

/** Unit vector on the image for an angle, 0° to the patient's left and 90° anterior. */
const unitAt = (deg: number): Point => ({ x: Math.cos((deg * Math.PI) / 180), y: -Math.sin((deg * Math.PI) / 180) });

/**
 * How far an angled neck has moved the aorta's centre at a slice, in mm
 * toward `neckAngle.towardDeg`: the lean added up from the bend at the end of
 * the neck to this slice. Zero below the bend, and constant above the angled
 * stretch.
 */
export function neckOffsetMm(c: CaseParams, z: number): number {
  const last = c.neckEndSlice + 2 * KNEE;
  let total = 0;
  for (let k = Math.max(0, Math.ceil(z)); k < last; k += 1) total += tiltAt(c, k) * SLICE_MM;
  return total;
}

function makeCase(params: CaseParams): EvarCase {
  const driftAt = (z: number) => params.driftPx * Math.sin(z / 18);

  const toward = unitAt(params.neckAngle.towardDeg);
  const sectionAt = (z: number) => ({ toward, stretch: Math.hypot(1, tiltAt(params, z)) });

  // The posterior wall rests on the vertebral body, so a bigger sac pushes the
  // centre forward rather than through the spine. An oval neck reaches further
  // back than a round one when it leans forward, so its depth counts too.
  const centreAt = (z: number): Point => {
    const at = Math.min(z, params.bifurcationSlice - 1);
    const radiusPx = outerRadiusMm(params, at) / PIXEL_MM;
    const { stretch } = sectionAt(at);
    const depthPx = radiusPx * Math.sqrt(1 + (stretch ** 2 - 1) * toward.y ** 2);
    const offsetPx = neckOffsetMm(params, z) / PIXEL_MM;
    return {
      x: SPINE.x + 20 + driftAt(z) + toward.x * offsetPx,
      y: SPINE.y - SPINE.ry - depthPx - SPINE_GAP_PX + toward.y * offsetPx,
    };
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

  const internalIliacCentreAt = (z: number, side: IliacSide): Point | null => {
    const from = params.internalIliacSlice[side];
    if (z < from) return null;
    const down = (z - from) * SLICE_MM;
    const common = iliacCentresAt(z)[side];
    // Radiological convention again: the patient's right is the image's left.
    const outward = side === "right" ? -1 : 1;
    return { x: common.x + outward * INTERNAL_ILIAC_DRIFT.outward * down, y: common.y + INTERNAL_ILIAC_DRIFT.back * down };
  };

  return {
    ...params,
    size: SIZE,
    pixelMm: PIXEL_MM,
    sliceMm: SLICE_MM,
    slices: SLICES,
    sectionAt,
    centreAt,
    iliacCentresAt,
    internalIliacCentreAt,
  };
}

export const EVAR_CASES: readonly EvarCase[] = [
  makeCase({
    id: "long-neck",
    title: "Long straight neck",
    blurb: "A textbook infrarenal aneurysm with a long, parallel neck and modest iliacs.",
    debrief:
      "Comfortably inside the usual instructions for use: a neck well over 15 mm long and under 32 mm wide, and iliacs that will take a standard limb. A fleck of calcified plaque sits at the front of the neck, bright on the angio window but inside the wall, so the outer edge is still the one to measure to.",
    neckRadiusMm: 11.5,
    sacRadiusMm: 29,
    ciaRadiusMm: { right: 7, left: 6.5 },
    lowestRenalSlice: 30,
    otherRenalAbove: 3,
    neckEndSlice: 39,
    sacPeakSlice: 58,
    bifurcationSlice: 78,
    driftPx: 3,
    neckTaperMm: 0,
    neckAngle: { deg: 10, towardDeg: 90 },
    neckThrombus: null,
    calcium: [{ atDeg: 150, spanDeg: 40, fromSlice: 31, toSlice: 35 }],
    internalIliacSlice: { right: 106, left: 108 },
    seed: 11,
  }),
  makeCase({
    id: "short-neck",
    title: "Short neck, wide right iliac",
    blurb: "A bigger sac that flares almost straight off the renals, with an ectatic right common iliac.",
    debrief:
      "The neck is shorter than the 15 mm most devices ask for, and the right common iliac is wide enough to need a flared limb or an iliac branch. This is the case where measuring carefully changes the plan. It also leans 30° to the patient's left, so on an axial slice the neck is an oval about 30 mm across one way and 26 mm the other. The short axis is the real diameter; the long one would push you up a main body size.",
    neckRadiusMm: 13,
    sacRadiusMm: 34,
    ciaRadiusMm: { right: 10, left: 7.5 },
    lowestRenalSlice: 34,
    otherRenalAbove: 2,
    neckEndSlice: 35,
    sacPeakSlice: 52,
    bifurcationSlice: 74,
    driftPx: 8,
    neckTaperMm: 0,
    neckAngle: { deg: 30, towardDeg: 0 },
    neckThrombus: null,
    calcium: [],
    internalIliacSlice: { right: 102, left: 101 },
    seed: 23,
  }),
  makeCase({
    id: "hostile-neck",
    title: "Hostile neck",
    blurb: "A wide, angled neck that only runs a centimetre down the slices before the sac, a big aneurysm, and a right common iliac that's nearly aneurysmal itself.",
    debrief:
      "A 30 mm neck sits at the top of the range a standard main body covers. On the slices the neck runs only 10 mm, about the shortest landing zone any current device accepts, but it leans, so along the vessel it's 16. The 24 mm right iliac needs the widest limb on the sizing sheet. Small measuring errors here move you from one device to another, or off the sheet entirely. The neck leans 50° to the patient's left, which turns the axial cut into an oval nearly 47 mm long when only the 30 mm short axis is real. A 4 mm crescent of thrombus lines the back of it and calcified plaque sits on its right wall: angled, short, lined and calcified is what makes a neck hostile.",
    neckRadiusMm: 15,
    sacRadiusMm: 35,
    ciaRadiusMm: { right: 12, left: 6 },
    lowestRenalSlice: 34,
    otherRenalAbove: 2,
    neckEndSlice: 36,
    sacPeakSlice: 52,
    bifurcationSlice: 72,
    driftPx: 10,
    neckTaperMm: 0,
    neckAngle: { deg: 50, towardDeg: 0 },
    neckThrombus: { atDeg: 270, thicknessMm: 4 },
    calcium: [{ atDeg: 180, spanDeg: 60, fromSlice: 33, toSlice: 37 }],
    internalIliacSlice: { right: 99, left: 102 },
    seed: 37,
  }),
  makeCase({
    id: "small-sac",
    title: "Small sac, long neck",
    blurb: "A modest aneurysm under a long, narrow neck, with iliacs a millimetre apart.",
    debrief:
      "At 52 mm the sac sits between the usual thresholds for repair, 55 mm in men and 50 mm in women, so whether to fix it at all is the real question. If you do, a 20 mm neck takes the smallest main body on the sheet, and the 12 and 11 mm iliacs fall either side of a limb boundary. The neck is conical, narrowing from 20 mm at the renals to 16 mm where it meets the sac, with calcified plaque on its left front wall. Size it at the top, where the graft seals first.",
    neckRadiusMm: 10,
    sacRadiusMm: 26,
    ciaRadiusMm: { right: 6, left: 5.5 },
    lowestRenalSlice: 28,
    otherRenalAbove: 2,
    neckEndSlice: 40,
    sacPeakSlice: 60,
    bifurcationSlice: 80,
    driftPx: 2,
    neckTaperMm: -2,
    neckAngle: { deg: 0, towardDeg: 0 },
    neckThrombus: null,
    calcium: [{ atDeg: 30, spanDeg: 50, fromSlice: 34, toSlice: 40 }],
    internalIliacSlice: { right: 108, left: 107 },
    seed: 41,
  }),
  makeCase({
    id: "wide-sac",
    title: "Wide sac, generous neck",
    blurb: "A big but simple aneurysm under a long, parallel neck.",
    debrief:
      "A 25 mm neck runs well past the 15 mm devices ask for and takes a 28 mm main body. Both iliacs land in the same limb band, so the size of the sac is the only thing that looks frightening here, and it doesn't change the device. A long arc of calcified plaque runs down the left side of the neck. It's bright on the angio window, but it's wall, so measure past it to the outer edge.",
    neckRadiusMm: 12.5,
    sacRadiusMm: 32,
    ciaRadiusMm: { right: 8, left: 7.5 },
    lowestRenalSlice: 32,
    otherRenalAbove: 3,
    neckEndSlice: 42,
    sacPeakSlice: 60,
    bifurcationSlice: 80,
    driftPx: 4,
    neckTaperMm: 0,
    neckAngle: { deg: 0, towardDeg: 0 },
    neckThrombus: null,
    calcium: [{ atDeg: 0, spanDeg: 90, fromSlice: 33, toSlice: 41 }],
    internalIliacSlice: { right: 107, left: 109 },
    seed: 53,
  }),
  makeCase({
    id: "narrow-iliacs",
    title: "Narrow iliacs",
    blurb: "An easy neck above small common iliacs on both sides.",
    debrief:
      "The neck is the easy part. At 9 and 10 mm the iliacs need the two narrowest limbs on the sheet, and iliacs this small usually mean small external iliacs too, so getting an 18 Fr main body up them becomes the question. A millimetre either way changes the limb. The neck leans 20° to the patient's right, enough that its long axis reads 23 mm and would wrongly take a 28 mm main body; the 22 mm short axis takes a 25. Calcified plaque lines its left wall.",
    neckRadiusMm: 11,
    sacRadiusMm: 29,
    ciaRadiusMm: { right: 4.5, left: 5 },
    lowestRenalSlice: 30,
    otherRenalAbove: 2,
    neckEndSlice: 40,
    sacPeakSlice: 62,
    bifurcationSlice: 80,
    driftPx: 5,
    neckTaperMm: 0,
    neckAngle: { deg: 20, towardDeg: 180 },
    neckThrombus: null,
    calcium: [{ atDeg: 0, spanDeg: 70, fromSlice: 31, toSlice: 38 }],
    internalIliacSlice: { right: 109, left: 108 },
    seed: 67,
  }),
  makeCase({
    id: "ectatic-left",
    title: "Wide left iliac",
    blurb: "A straightforward neck and sac, with the wide common iliac on the left this time.",
    debrief:
      "The short neck case's iliac problem on the other side. The 19 mm left common iliac takes a 24 mm limb and the 13 mm right a 16. Which side the main body goes up decides which leg the wide limb belongs on, so check the device picker agrees with the side you chose. The neck flares too, from 24 mm at the renals, and passes 110% of that only 8 mm down, so by the usual definition the landing zone is 8 mm long even though the sac doesn't visibly start for another few slices. A 3 mm crescent of thrombus lines its left side; measure to the outer wall, not the edge of the contrast.",
    neckRadiusMm: 12,
    sacRadiusMm: 30,
    ciaRadiusMm: { right: 6.5, left: 9.5 },
    lowestRenalSlice: 32,
    otherRenalAbove: 3,
    neckEndSlice: 40,
    sacPeakSlice: 56,
    bifurcationSlice: 76,
    driftPx: 6,
    neckTaperMm: 3,
    neckAngle: { deg: 0, towardDeg: 0 },
    neckThrombus: { atDeg: 0, thicknessMm: 3 },
    calcium: [],
    internalIliacSlice: { right: 104, left: 105 },
    seed: 79,
  }),
  makeCase({
    id: "short-wide",
    title: "Short, wide neck",
    blurb: "A 28 mm neck that only just falls short of the usual landing length, over a big sac.",
    debrief:
      "On the slices the neck is 14 mm, just under the 15 most devices want, but it leans, so along the vessel it's 15.5: just over. At 28 mm wide it takes a 32 mm main body. It's the kind of neck that tempts you to call it close enough, and here the centerline is what settles it. The 22 mm left iliac needs a 24 mm limb. The neck leans 25° forward and to the left, so its long axis on an axial slice reads about 31 mm, which would wrongly take a 36. Calcified plaque sits on its right wall.",
    neckRadiusMm: 14,
    sacRadiusMm: 37,
    ciaRadiusMm: { right: 8, left: 11 },
    lowestRenalSlice: 34,
    otherRenalAbove: 2,
    neckEndSlice: 38,
    sacPeakSlice: 54,
    bifurcationSlice: 74,
    driftPx: 9,
    neckTaperMm: 0,
    neckAngle: { deg: 25, towardDeg: 60 },
    neckThrombus: null,
    calcium: [{ atDeg: 200, spanDeg: 80, fromSlice: 34, toSlice: 38 }],
    internalIliacSlice: { right: 101, left: 104 },
    seed: 83,
  }),
  makeCase({
    id: "giant-sac",
    title: "Giant sac, wide iliacs",
    blurb: "An 8 cm aneurysm that pushes everything aside, over two wide common iliacs.",
    debrief:
      "An 80 mm sac shoves the IVC and the bowel out of its way. The neck is only just long enough at 16 mm, and both common iliacs need the 28 mm limb, the widest on the sheet. Any wider and they'd need an iliac branch device, or the internal iliac coiled and the limb taken down into the external. The neck leans 40°, so its long axis on an axial slice is about 35 mm, off the end of the sheet, while the short axis is 27. Thrombus lines the front of it.",
    neckRadiusMm: 13.5,
    sacRadiusMm: 40,
    ciaRadiusMm: { right: 11.5, left: 12.5 },
    lowestRenalSlice: 32,
    otherRenalAbove: 3,
    neckEndSlice: 35,
    sacPeakSlice: 54,
    bifurcationSlice: 70,
    driftPx: 10,
    neckTaperMm: 0,
    neckAngle: { deg: 40, towardDeg: 30 },
    neckThrombus: { atDeg: 120, thicknessMm: 3 },
    calcium: [],
    internalIliacSlice: { right: 98, left: 99 },
    seed: 97,
  }),
];

/** One vessel's cross-section on a slice, in pixels on the image. */
type Section = {
  outerPx: number;
  lumenPx: number;
  /** Where the lumen's centre sits relative to the vessel's, pushed away from thrombus. */
  lumenShift: Point;
  /** An angled vessel cuts as an oval, `stretch` times longer toward `toward`. */
  toward: Point;
  stretch: number;
  /** Arcs of calcified plaque on this slice, in degrees. */
  plaque: readonly { atDeg: number; spanDeg: number }[];
};

const round = (outerPx: number, lumenPx: number): Section => ({
  outerPx,
  lumenPx,
  lumenShift: { x: 0, y: 0 },
  toward: { x: 1, y: 0 },
  stretch: 1,
  plaque: [],
});

const inArc = (deg: number, arc: { atDeg: number; spanDeg: number }) => {
  const off = (((deg - arc.atDeg) % 360) + 540) % 360 - 180;
  return Math.abs(off) <= arc.spanDeg / 2;
};

/**
 * Draws one vessel cross-section: outer wall, thrombus, a contrast lumen, and
 * any calcified plaque. An oval cut is squashed back to round first, so the
 * wall, the lumen and the plaque all follow the oval.
 */
function vesselHU(dx: number, dy: number, v: Section, z: number): number | null {
  const along = (dx * v.toward.x + dy * v.toward.y) / v.stretch;
  const across = -dx * v.toward.y + dy * v.toward.x;
  const x = along * v.toward.x - across * v.toward.y;
  const y = along * v.toward.y + across * v.toward.x;
  const d = Math.hypot(x, y);
  if (d > v.outerPx) return null;
  const wallPx = WALL_MM / PIXEL_MM;
  const deg = (Math.atan2(-y, x) * 180) / Math.PI;
  const plaque = v.plaque.some((arc) => inArc(deg, arc));
  if (plaque && d > v.outerPx - wallPx - PLAQUE_MM / PIXEL_MM) return HU.calcium;
  if (Math.hypot(x - v.lumenShift.x, y - v.lumenShift.y) <= v.lumenPx) return HU.lumen;
  if (d > v.outerPx - wallPx) {
    return Math.sin(Math.atan2(y, x) * 7 + z * 0.3) > 0.97 ? HU.calcium : HU.wall;
  }
  return HU.thrombus;
}

/**
 * The aorta's cross-section on a slice. In the neck the lumen fills the wall
 * unless a thrombus crescent lines it; in the sac it stays the width of the
 * end of the neck and sits forward, the way thrombus usually lines the back.
 */
function aortaSection(c: EvarCase, z: number): Section {
  const outerPx = outerRadiusMm(c, z) / PIXEL_MM;
  const wallPx = WALL_MM / PIXEL_MM;
  const { toward, stretch } = c.sectionAt(z);
  const plaque = c.calcium.filter((arc) => z >= arc.fromSlice && z <= arc.toSlice);
  const inNeck = z > c.lowestRenalSlice - 1 && z <= c.neckEndSlice;
  if (z <= c.neckEndSlice) {
    const thrombus = inNeck ? c.neckThrombus : null;
    const halfPx = thrombus ? thrombus.thicknessMm / 2 / PIXEL_MM : 0;
    const away = thrombus ? unitAt(thrombus.atDeg + 180) : { x: 0, y: 0 };
    return {
      outerPx,
      lumenPx: outerPx - wallPx - halfPx,
      lumenShift: { x: away.x * halfPx, y: away.y * halfPx },
      toward,
      stretch,
      plaque,
    };
  }
  const neckEndPx = (c.neckRadiusMm + c.neckTaperMm) / PIXEL_MM;
  const lumenPx = Math.min(outerPx - wallPx, neckEndPx - wallPx);
  const shift = (outerPx - wallPx - lumenPx) * 0.6;
  return { outerPx, lumenPx, lumenShift: { x: 0, y: -shift }, toward, stretch, plaque };
}

/**
 * Everything around the vessels that changes from slice to slice, worked out
 * once per slice rather than once per pixel.
 */
type Scene = {
  kidneys: { outline: Ellipse; sinus: Ellipse }[];
  liver: Ellipse | null;
  spleen: Ellipse | null;
  psoas: Ellipse[];
  bowel: { x: number; y: number; r: number; gas: boolean }[];
};

function sceneAt(c: EvarCase, z: number): Scene {
  const kz = (z - (c.lowestRenalSlice - 2)) / 22;
  const kidneyScale = Math.abs(kz) < 1 ? Math.sqrt(1 - kz * kz) : 0;
  const kidneys =
    kidneyScale === 0
      ? []
      : [-1, 1].map((side) => {
          const outline = { x: SPINE.x + side * KIDNEY.dx, y: KIDNEY.y, rx: KIDNEY.rx * kidneyScale, ry: KIDNEY.ry * kidneyScale };
          // The sinus opens toward the spine, where the renal vessels go in.
          const sinus = { x: outline.x - side * outline.rx * 0.35, y: outline.y, rx: outline.rx * 0.4, ry: outline.ry * 0.45 };
          return { outline, sinus };
        });

  // The liver fills the patient's right upper abdomen and is gone a little above the renals.
  const liverEnd = c.lowestRenalSlice - 6;
  const liverScale = z < liverEnd ? Math.sqrt(1 - (z / liverEnd) ** 2) : 0;
  const liver = liverScale === 0 ? null : { ...LIVER, rx: LIVER.rx * liverScale, ry: LIVER.ry * liverScale };
  const spleenEnd = c.lowestRenalSlice - 12;
  const spleenScale = z < spleenEnd ? Math.sqrt(1 - (z / spleenEnd) ** 2) : 0;
  const spleen = spleenScale === 0 ? null : { ...SPLEEN, rx: SPLEEN.rx * spleenScale, ry: SPLEEN.ry * spleenScale };

  // Psoas starts as a sliver beside the upper lumbar spine and thickens toward the pelvis.
  const t = z / (SLICES - 1);
  const psoasRx = 5 + 17 * t;
  const psoas = [-1, 1].map((side) => ({
    x: SPINE.x + side * (SPINE.rx + psoasRx - 5),
    y: SPINE.y + 4,
    rx: psoasRx,
    ry: 5 + 13 * t,
  }));

  // Seeded per case so the bowel is the same every visit, drifting a little from slice to slice.
  const random = mulberry32(c.seed * 104729);
  const bowel = Array.from({ length: BOWEL_LOOPS }, (_, i) => {
    const phase = random() * Math.PI * 2;
    const r = 10 + random() * 8;
    const gx = (random() - 0.5) * 1.4 * (VISCERA.rx - 18);
    const gy = (random() - 0.5) * 1.4 * (VISCERA.ry - 18);
    return {
      x: VISCERA.x + gx + 6 * Math.sin(z / 9 + phase),
      y: VISCERA.y + gy + 4 * Math.cos(z / 11 + phase),
      r,
      gas: i % 2 === 0,
    };
  });

  return { kidneys, liver, spleen, psoas, bowel };
}

/** The scanner table: two thin shells with foam between, curving up at the sides. */
function tableHU(x: number, y: number): number | null {
  const dx = x - BODY.x;
  if (Math.abs(dx) > 170) return null;
  const top = BODY.y + BODY.ry + 6 - 0.0008 * dx * dx;
  const depth = y - top;
  if (depth < 0 || depth > 10) return null;
  return depth < 3 || depth > 8 ? HU.table : HU.foam;
}

function backgroundHU(scene: Scene, x: number, y: number): number {
  if (!insideEllipse(x, y, BODY)) return tableHU(x, y) ?? HU.air;
  if (!insideEllipse(x, y, SKIN_INNER)) return HU.soft;
  if (!insideEllipse(x, y, FAT_INNER)) return HU.fat;
  if (!insideEllipse(x, y, MUSCLE_INNER)) return HU.muscle;

  const spineQ = ellipseQ(x, y, SPINE);
  if (spineQ <= 1) return spineQ > 0.75 ? HU.cortex : HU.marrow;
  const canalD2 = (x - CANAL.x) ** 2 + (y - CANAL.y) ** 2;
  if (canalD2 <= CANAL.r ** 2) return HU.csf;
  // Pedicles and laminae close the canal behind the body, and the spinous process points back from them.
  if (canalD2 <= LAMINA_R ** 2 && y > CANAL.y - 4) return HU.cortex;
  if (insideEllipse(x, y, SPINOUS)) return HU.cortex;
  if (ERECTORS.some((e) => insideEllipse(x, y, e)) || scene.psoas.some((p) => insideEllipse(x, y, p))) return HU.muscle;
  const kidney = scene.kidneys.find((k) => insideEllipse(x, y, k.outline));
  if (kidney) {
    if (insideEllipse(x, y, kidney.sinus)) return HU.fat;
    return ellipseQ(x, y, kidney.outline) > 0.6 ? HU.renalCortex : HU.renalMedulla;
  }
  if (scene.liver && insideEllipse(x, y, scene.liver)) return HU.liver;
  if (scene.spleen && insideEllipse(x, y, scene.spleen)) return HU.spleen;

  if (insideEllipse(x, y, VISCERA)) {
    const loop = scene.bowel.find((b) => (x - b.x) ** 2 + (y - b.y) ** 2 <= b.r ** 2);
    if (loop) {
      if ((x - loop.x) ** 2 + (y - loop.y) ** 2 > (loop.r - 2.5) ** 2) return HU.soft;
      // Supine, so gas floats to the front of the loop above a flat fluid level.
      return loop.gas && y - loop.y < loop.r * 0.2 ? HU.air : HU.bowelFluid;
    }
  }
  return HU.fat;
}

/**
 * The IVC on the patient's right of the aorta, resting on the spine. A big
 * sac shoves it further right. It ends a little below the bifurcation,
 * where it would split into the iliac veins.
 */
function ivcAt(c: EvarCase, z: number, aortaCentre: Point, aortaPx: number): Ellipse | null {
  if (z > c.bifurcationSlice + 4) return null;
  const pushed = aortaPx > 0 ? aortaCentre.x - aortaPx - 4 - IVC.rx : Infinity;
  return { x: Math.min(SPINE.x - 32, pushed), y: SPINE.y - SPINE.ry - IVC.ry - 1, rx: IVC.rx, ry: IVC.ry };
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

/** A [1, 2, 1] blur across and then down, standing in for partial volume and the reconstruction kernel. */
function blur(src: Float32Array): Float32Array {
  const across = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const i = y * SIZE + x;
      const left = src[x > 0 ? i - 1 : i];
      const right = src[x < SIZE - 1 ? i + 1 : i];
      across[i] = (left + 2 * src[i] + right) / 4;
    }
  }
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const i = y * SIZE + x;
      const up = across[y > 0 ? i - SIZE : i];
      const down = across[y < SIZE - 1 ? i + SIZE : i];
      out[i] = (up + 2 * across[i] + down) / 4;
    }
  }
  return out;
}

/**
 * Noise that looks like CT: values on a coarse grid, interpolated so
 * neighbouring pixels move together, plus a little fine speckle on top.
 */
function grainyNoise(random: () => number): Float32Array {
  const cells = SIZE / GRAIN + 2;
  const coarse = Float32Array.from({ length: cells * cells }, () => (random() + random() + random() - 1.5) * 36);
  const out = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y += 1) {
    const gy = y / GRAIN;
    const y0 = Math.floor(gy);
    const fy = gy - y0;
    for (let x = 0; x < SIZE; x += 1) {
      const gx = x / GRAIN;
      const x0 = Math.floor(gx);
      const fx = gx - x0;
      const i = y0 * cells + x0;
      const top = coarse[i] * (1 - fx) + coarse[i + 1] * fx;
      const bottom = coarse[i + cells] * (1 - fx) + coarse[i + cells + 1] * fx;
      out[y * SIZE + x] = top * (1 - fy) + bottom * fy + (random() - 0.5) * 16;
    }
  }
  return out;
}

/** One axial slice in Hounsfield units, row-major, `size * size` long. */
export function sliceHU(c: EvarCase, z: number): Int16Array {
  const tissue = new Float32Array(SIZE * SIZE);
  const random = mulberry32(c.seed * 7919 + z);
  const scene = sceneAt(c, z);
  const aortaPx = outerRadiusMm(c, z) / PIXEL_MM;
  const aorta = aortaPx > 0 ? aortaSection(c, z) : null;
  const wallPx = WALL_MM / PIXEL_MM;
  const centre = c.centreAt(z);
  const iliacs = c.iliacCentresAt(z);
  const iliacPx = { right: c.ciaRadiusMm.right / PIXEL_MM, left: c.ciaRadiusMm.left / PIXEL_MM };
  const ivc = ivcAt(c, z, centre, aortaPx);
  const internals = (["right", "left"] as const).flatMap((side) => c.internalIliacCentreAt(z, side) ?? []);
  const internalPx = INTERNAL_ILIAC_RADIUS_MM / PIXEL_MM;
  const internalSection = round(internalPx, internalPx - wallPx);

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      let hu: number | null = null;
      if (aorta) {
        hu = vesselHU(x - centre.x, y - centre.y, aorta, z);
      } else {
        // Where an internal iliac leaves its common iliac the two lumens run together, so lumen wins over wall.
        const hits = [
          vesselHU(x - iliacs.right.x, y - iliacs.right.y, round(iliacPx.right, iliacPx.right - wallPx), z),
          vesselHU(x - iliacs.left.x, y - iliacs.left.y, round(iliacPx.left, iliacPx.left - wallPx), z),
          ...internals.map((at) => vesselHU(x - at.x, y - at.y, internalSection, z)),
        ];
        hu = hits.includes(HU.lumen) ? HU.lumen : (hits.find((h) => h !== null) ?? null);
      }
      hu ??= renalHU(c, x, y, z) ?? (ivc && insideEllipse(x, y, ivc) ? HU.ivc : backgroundHU(scene, x, y));
      tissue[y * SIZE + x] = hu;
    }
  }

  const smooth = blur(tissue);
  const noise = grainyNoise(random);
  // Air outside the patient stays flat, so the noise doesn't paint a halo round the body.
  return Int16Array.from(smooth, (hu, i) => Math.round(tissue[i] === HU.air ? hu : hu + noise[i]));
}

/** Centre of the vessel being followed on a slice: the aorta, then one iliac below the bifurcation. */
const pathAt = (c: EvarCase, z: number, side: IliacSide): Point =>
  z < c.bifurcationSlice ? c.centreAt(z) : c.iliacCentresAt(z)[side];

/**
 * Length along the vessel between two slices, in mm: each slice-to-slice step
 * in 3D, so an angled neck or an iliac heading outward counts for more than
 * the slice spacing. Below the bifurcation it follows `side`'s iliac.
 */
export function centerlineMm(c: EvarCase, from: number, to: number, side: IliacSide = "right"): number {
  const [a, b] = from <= to ? [from, to] : [to, from];
  let total = 0;
  for (let z = a; z < b; z += 1) {
    const p = pathAt(c, z, side);
    const q = pathAt(c, z + 1, side);
    total += Math.hypot((q.x - p.x) * c.pixelMm, (q.y - p.y) * c.pixelMm, c.sliceMm);
  }
  return total;
}

/** The distances device lengths are judged by, from the case's own landmarks. */
export function anatomyFor(c: EvarCase): Anatomy;
/** The same distances from marked slices, leaving out any that need a mark that isn't there. */
export function anatomyFor(c: EvarCase, marks: Partial<Landmarks>): MarkedAnatomy;
export function anatomyFor(c: EvarCase, marks?: Partial<Landmarks>): Anatomy | MarkedAnatomy {
  const at: Partial<Landmarks> = marks ?? {
    renal: c.lowestRenalSlice,
    bifurcation: c.bifurcationSlice,
    rightInternalIliac: c.internalIliacSlice.right,
    leftInternalIliac: c.internalIliacSlice.left,
  };
  const { renal } = at;
  const along = (to: number | undefined, side: IliacSide) =>
    renal === undefined || to === undefined ? undefined : centerlineMm(c, renal, to, side);
  const right = along(at.rightInternalIliac, "right");
  const left = along(at.leftInternalIliac, "left");
  return {
    renalToBifurcation: along(at.bifurcation, "right"),
    renalToInternalIliac: { ...(right === undefined ? {} : { right }), ...(left === undefined ? {} : { left }) },
  };
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
    neckLength: centerlineMm(c, c.lowestRenalSlice, sacStartSlice),
    maxSac: maxRadius * 2,
    rightCia: c.ciaRadiusMm.right * 2,
    leftCia: c.ciaRadiusMm.left * 2,
    sacStartSlice,
  };
}
