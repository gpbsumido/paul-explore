/**
 * The demo's feature flags reset to their seeded state on a fixed 6-hour UTC
 * cadence (00:00, 06:00, 12:00, 18:00 UTC), matching the portfolio_api reset
 * cron. These pure helpers turn "now" into a friendly "resets in ~2h 14m" hint
 * so a visitor knows any change they make is temporary.
 */

const RESET_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Milliseconds from `now` until the next 6-hour UTC reset boundary. Sitting
 * exactly on a boundary returns a full interval rather than zero, so the hint
 * always points at the next reset.
 */
export function msUntilNextReset(now: Date): number {
  const sinceEpoch = now.getTime();
  const intoInterval = sinceEpoch % RESET_INTERVAL_MS;
  return RESET_INTERVAL_MS - intoInterval;
}

/**
 * A short "2h 14m" / "43m" label for a countdown, rounding up to the current
 * minute so it never flashes 0m while time is still left. Under a minute it
 * reads as a calm "under a minute" rather than a jittery second count.
 */
export function formatResetCountdown(ms: number): string {
  if (ms < 60_000) return "under a minute";
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
