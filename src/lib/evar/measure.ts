/**
 * The maths behind the EVAR sizing practice: calipers in millimetres, CT
 * windowing, and scoring an attempt against a case's reference values.
 *
 * Pure functions on plain numbers, so the viewer and any future data source
 * (a real CTA stack instead of the phantom) share one definition of "right".
 */

export type Point = { x: number; y: number };

export type CtWindow = { label: string; width: number; level: number };

/**
 * Two presets are enough to make the point. Angio separates contrast from
 * wall and thrombus; soft tissue makes the outer wall easier to find, which is
 * the edge EVAR diameters are taken from.
 */
export type WindowId = "angio" | "soft";

export const WINDOWS: Readonly<Record<WindowId, CtWindow>> = {
  angio: { label: "Angio (W600 L150)", width: 600, level: 150 },
  soft: { label: "Soft tissue (W400 L40)", width: 400, level: 40 },
};

export type TaskId =
  | "neckDiameter"
  | "neckLength"
  | "maxSac"
  | "rightCia"
  | "leftCia";

export type Reference = Record<TaskId, number>;
export type Attempt = Partial<Record<TaskId, number>>;

export const TASKS: readonly { id: TaskId; label: string }[] = [
  { id: "neckDiameter", label: "Proximal neck diameter" },
  { id: "neckLength", label: "Neck length" },
  { id: "maxSac", label: "Maximum sac diameter" },
  { id: "rightCia", label: "Right common iliac diameter" },
  { id: "leftCia", label: "Left common iliac diameter" },
];

/**
 * How far off still counts. Two millimetres is roughly where experienced
 * readers disagree with each other on a diameter, and five on a length is
 * about two slices either way.
 */
export const TOLERANCE_MM: Record<TaskId, number> = {
  neckDiameter: 2,
  neckLength: 5,
  maxSac: 2,
  rightCia: 2,
  leftCia: 2,
};

export type TaskScore = {
  id: TaskId;
  label: string;
  yours: number | null;
  reference: number;
  delta: number | null;
  verdict: "within" | "outside" | "unmeasured";
};

/** Straight-line caliper length, converted from image pixels to mm. */
export function distanceMm(a: Point, b: Point, pixelMm: number): number {
  return Math.hypot(b.x - a.x, b.y - a.y) * pixelMm;
}

/** Maps a Hounsfield value to a 0-255 grey through a window. */
export function toGray(hu: number, window: CtWindow): number {
  const low = window.level - window.width / 2;
  const scaled = ((hu - low) / window.width) * 255;
  return Math.round(Math.min(255, Math.max(0, scaled)));
}

/** One row per task, in task order, whether or not it was measured. */
export function score(attempt: Attempt, reference: Reference): TaskScore[] {
  return TASKS.map(({ id, label }) => {
    const yours = attempt[id] ?? null;
    if (yours === null) {
      return { id, label, yours, reference: reference[id], delta: null, verdict: "unmeasured" };
    }
    const delta = yours - reference[id];
    const within = Math.abs(delta) <= TOLERANCE_MM[id] + 1e-9;
    return {
      id,
      label,
      yours,
      reference: reference[id],
      delta,
      verdict: within ? "within" : "outside",
    };
  });
}
