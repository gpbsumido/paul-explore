/**
 * Points and stars for a finished EVAR attempt, so practice has something to
 * beat. The verdicts still come from `score` and `gradeDevices`; this only
 * turns them into a number worth chasing.
 */

import type { DeviceGrade } from "./endurant";
import type { Level, LevelId } from "./levels";
import type { TaskScore } from "./measure";

export type Stars = 0 | 1 | 2 | 3;

export type Outcome = {
  /** Measurements within tolerance, out of five. */
  within: number;
  stars: Stars;
  measurementPoints: number;
  devicePoints: number;
  timeBonus: number;
  multiplier: number;
  total: number;
};

const DEVICE_POINTS = 50;
const TIME_BONUS = 100;

const MULTIPLIER: Record<LevelId, number> = { easy: 1, medium: 1.5, hard: 2 };

/**
 * A pass is worth 50 just for landing inside tolerance, and up to 100 for
 * landing on the answer. Anything outside earns nothing, so a near miss on
 * the wrong side of the line doesn't outscore an honest pass.
 */
function measurementPoints(row: TaskScore, tolerance: number): number {
  if (row.verdict !== "within" || row.delta === null) return 0;
  return 50 + 50 * (1 - Math.min(1, Math.abs(row.delta) / tolerance));
}

/** Stars only count measurements, since that's the skill the practice is for. */
const starsFor = (within: number): Stars => (within >= 5 ? 3 : within === 4 ? 2 : within === 3 ? 1 : 0);

/** Totals an attempt. `remainingMs` is null on untimed levels. */
export function outcomeFor({
  scores,
  grades,
  level,
  remainingMs,
}: {
  scores: readonly TaskScore[];
  /** Every device check, diameters and lengths alike; each match is worth the same. */
  grades: readonly Pick<DeviceGrade, "verdict">[];
  level: Level;
  remainingMs: number | null;
}): Outcome {
  const within = scores.filter((row) => row.verdict === "within").length;
  const measured = scores.reduce((sum, row) => sum + measurementPoints(row, level.tolerance[row.id]), 0);
  const devices = grades.filter((row) => row.verdict === "match").length * DEVICE_POINTS;
  const timeBonus =
    level.timeLimitMs === null || remainingMs === null
      ? 0
      : (Math.max(0, remainingMs) / level.timeLimitMs) * TIME_BONUS;
  const multiplier = MULTIPLIER[level.id];
  return {
    within,
    stars: starsFor(within),
    measurementPoints: measured,
    devicePoints: devices,
    timeBonus,
    multiplier,
    total: Math.round((measured + devices + timeBonus) * multiplier),
  };
}
