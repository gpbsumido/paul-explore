/**
 * The NBA season in progress, named the way ESPN and the playoffs API name it:
 * by the year it ends. A season tips off in October, so from October on it's
 * next year's season (November 2026 is the 2027 season).
 */
export function currentNbaSeason(now: Date = new Date()): number {
  const OCTOBER = 9;
  return now.getMonth() >= OCTOBER ? now.getFullYear() + 1 : now.getFullYear();
}
