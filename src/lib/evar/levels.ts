/**
 * Difficulty levels for the EVAR sizing practice. A level picks which
 * anatomy you get, whether you get told where to look, how close counts, and
 * whether there's a clock.
 */

import { EVAR_CASES, referenceFor, type EvarCase } from "./phantom";
import type { PracticeCase, ScanCase } from "./scans";
import { TOLERANCE_MM, type TaskId } from "./measure";

export type LevelId = "easy" | "medium" | "hard";

export type Level = {
  id: LevelId;
  label: string;
  blurb: string;
  /** The phantoms it plays, in order. */
  caseIds: readonly string[];
  /** Whether every real scan is offered after them. */
  includesScans: boolean;
  hints: boolean;
  tolerance: Record<TaskId, number>;
  timeLimitMs: number | null;
};

export const LEVELS: readonly Level[] = [
  {
    id: "easy",
    label: "Easy",
    blurb: "Straightforward cases, with hints on which slices to look at. Diameters pass within 3 mm and lengths within 8 mm.",
    caseIds: ["long-neck", "small-sac", "wide-sac"],
    includesScans: false,
    hints: true,
    tolerance: { neckDiameter: 3, neckLength: 8, maxSac: 3, rightCia: 3, leftCia: 3 },
    timeLimitMs: null,
  },
  {
    id: "medium",
    label: "Medium",
    blurb: "Standard phantoms and every real scan, no hints. Diameters pass within 2 mm and lengths within 5 mm.",
    caseIds: ["long-neck", "short-neck", "narrow-iliacs", "ectatic-left"],
    includesScans: true,
    hints: false,
    tolerance: TOLERANCE_MM,
    timeLimitMs: null,
  },
  {
    id: "hard",
    label: "Hard",
    blurb: "The awkward anatomy, no hints, standard tolerances, and five minutes. When the clock runs out your answers are handed in as they are.",
    caseIds: ["short-neck", "hostile-neck", "short-wide", "giant-sac"],
    includesScans: false,
    hints: false,
    tolerance: TOLERANCE_MM,
    timeLimitMs: 5 * 60 * 1000,
  },
];

const PHANTOMS = new Map(EVAR_CASES.map((c) => [c.id, c]));

/**
 * The cases a level plays: its phantoms in the order it lists them, then,
 * where the level takes them, every real scan the manifest has.
 */
export function casesFor(level: Level, scans: readonly ScanCase[] = []): PracticeCase[] {
  const phantoms = level.caseIds.flatMap((id) => PHANTOMS.get(id) ?? []);
  return level.includesScans ? [...phantoms, ...scans] : phantoms;
}

export type Hint = { label: string; from: number; to: number };

/**
 * Where to look, as slice ranges counted from 1 the way the slider shows them.
 * The ranges sit a little off-centre so their midpoint isn't the answer.
 */
export function hintsFor(c: EvarCase): Hint[] {
  const { sacStartSlice } = referenceFor(c);
  const around = (label: string, slice: number, before: number, after: number): Hint => ({
    label,
    from: slice + 1 - before,
    to: slice + 1 + after,
  });
  return [
    around("Lowest renal artery", c.lowestRenalSlice, 2, 4),
    around("Aneurysm start", sacStartSlice, 3, 2),
    around("Widest part of the sac", c.sacPeakSlice, 4, 6),
    around("Iliacs, clear of the bifurcation", c.bifurcationSlice + 8, 2, 6),
    around("Aortic bifurcation", c.bifurcationSlice, 3, 2),
    {
      label: "Internal iliac origins",
      from: Math.min(c.internalIliacSlice.right, c.internalIliacSlice.left) + 1 - 3,
      to: Math.min(c.slices, Math.max(c.internalIliacSlice.right, c.internalIliacSlice.left) + 1 + 2),
    },
  ];
}
