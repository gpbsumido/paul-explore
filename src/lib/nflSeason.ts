/**
 * The NFL season in progress, named the way ESPN names it: by the year it
 * kicks off. Fantasy playoffs run into January and nothing new exists until
 * September, so until kickoff it's still last year's season.
 */
export function currentNflSeason(now: Date = new Date()): number {
  const SEPTEMBER = 8;
  return now.getMonth() >= SEPTEMBER ? now.getFullYear() : now.getFullYear() - 1;
}
