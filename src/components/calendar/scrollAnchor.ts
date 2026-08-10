/**
 * Keeping the calendar still while its content changes underneath.
 *
 * The infinite scroller had compensation for exactly one case: prepending a
 * period at the top, where it captured scrollHeight before the insert and
 * corrected scrollTop after. That is the right idea applied too narrowly.
 * Period content also changes height when event data arrives, when a refetch
 * lands, and when countdowns load -- and any of those growing above the
 * viewport shoves what you are reading down the screen.
 *
 * So instead of compensating for one known mutation, anchor on what the reader
 * is actually looking at: remember which period sits at the top of the
 * container and where, and after any render put it back. One mechanism covers
 * prepends, data arrival and anything added later.
 */

export type PeriodTop = { key: string; top: number };

/**
 * The period the reader is looking at: the last one whose top edge has passed
 * the top of the container, falling back to the first when none has.
 *
 * The threshold is small rather than zero so a period sitting a pixel or two
 * below the edge still counts as the one in view.
 */
export function pickAnchor(
  periods: PeriodTop[],
  threshold = 10,
): PeriodTop | null {
  if (periods.length === 0) return null;
  let best: PeriodTop | null = null;
  for (const period of periods) {
    if (period.top <= threshold) best = period;
  }
  return best ?? periods[0];
}

/**
 * How far to move scrollTop so the anchored period returns to where it was.
 *
 * Sub-pixel differences are ignored: layout rounding produces endless
 * fractional corrections, and writing scrollTop on every render to chase them
 * would be its own kind of jitter.
 */
export function anchorCorrection(
  anchoredTop: number,
  currentTop: number,
  epsilon = 1,
): number {
  const delta = currentTop - anchoredTop;
  return Math.abs(delta) < epsilon ? 0 : delta;
}
