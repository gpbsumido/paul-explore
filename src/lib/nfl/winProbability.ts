/**
 * Win probability for a fantasy football matchup. ESPN carries no win-prob
 * field for a head-to-head points league, so this derives one from the
 * projected final scores — the sibling of `impliedProbability` in the ZeroProof
 * board, which maps a betting price to the same 0..1 scale.
 *
 * Each side's projected final is what it has scored plus what its unfinished
 * starters are still projected to add. The margin between the two projections
 * feeds a normal model whose spread widens with the points still unplayed, so a
 * lead early in the week counts for less than the same lead once the games are
 * nearly done.
 */

/** A small floor so a settled matchup still divides cleanly. */
const BASE_SIGMA = 2;
/** How fast the spread grows with unplayed points (√ of remaining points). */
const REMAINING_SIGMA_K = 2;
/** Logistic approximation of the standard-normal CDF (Φ(z) ≈ 1/(1+e^-1.702z)). */
const LOGISTIC_SCALE = 1.702;

export interface WinProbabilityInput {
  awayActual: number;
  awayRemaining: number;
  homeActual: number;
  homeRemaining: number;
}

export interface WinProbability {
  /** Probability the home side wins, 0..1. */
  home: number;
  /** Probability the away side wins, 0..1. */
  away: number;
}

/** Projected-final win probability for both sides of a matchup. */
export function winProbability(input: WinProbabilityInput): WinProbability {
  const awayFinal = input.awayActual + input.awayRemaining;
  const homeFinal = input.homeActual + input.homeRemaining;
  const margin = homeFinal - awayFinal;

  const unplayed = Math.max(0, input.awayRemaining + input.homeRemaining);
  const sigma = BASE_SIGMA + REMAINING_SIGMA_K * Math.sqrt(unplayed);

  const home = 1 / (1 + Math.exp((-LOGISTIC_SCALE * margin) / sigma));
  return { home, away: 1 - home };
}
