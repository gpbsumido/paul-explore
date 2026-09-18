import type { ZeroproofEvent } from "./schemas";
import { isPastFixture } from "./boardFilters";

/**
 * The two "look at this one" cards above the board: the longest shot you could
 * take today, and the game that's closest to a coin flip. Both are pure reads
 * over the events already on screen, so they follow the board's own filters and
 * horizon without a second query.
 */

/** Where an American price sits as a win probability. +100 is a coin flip. */
export function impliedProbability(american: number): number {
  return american >= 0 ? 100 / (american + 100) : -american / (-american + 100);
}

export type UnderdogHighlight = {
  event: ZeroproofEvent;
  /** The underdog side's name (the outcome carrying the long price). */
  selection: string;
  priceAmerican: number;
};

export type CloseGameHighlight = {
  event: ZeroproofEvent;
  outcomes: { name: string; priceAmerican: number }[];
  /** Gap in implied win probability between the two sides. 0 is a pick'em. */
  spread: number;
};

/** The moneyline for an event, if it has one posted. */
function moneyline(event: ZeroproofEvent) {
  return event.markets.find((market) => market.market === "h2h");
}

/** Only games you could actually still bet — upcoming, not already final. */
function bettable(events: ZeroproofEvent[], now: number): ZeroproofEvent[] {
  return events.filter((event) => !isPastFixture(event, now));
}

/**
 * The longest positive-odds side anywhere on the bettable board — the team the
 * market likes least, i.e. the biggest payout if it comes in. Null when nothing
 * on the board is priced as an underdog.
 */
export function biggestUnderdog(
  events: ZeroproofEvent[],
  now: number,
): UnderdogHighlight | null {
  let best: UnderdogHighlight | null = null;
  for (const event of bettable(events, now)) {
    const market = moneyline(event);
    if (!market) continue;
    for (const outcome of market.outcomes) {
      if (outcome.priceAmerican <= 0) continue;
      if (best === null || outcome.priceAmerican > best.priceAmerican) {
        best = { event, selection: outcome.name, priceAmerican: outcome.priceAmerican };
      }
    }
  }
  return best;
}

/**
 * The bettable two-way matchup whose sides sit closest together — the nearest
 * thing to a coin flip on the board. Null when no upcoming game has a two-sided
 * moneyline.
 */
export function closestGame(
  events: ZeroproofEvent[],
  now: number,
): CloseGameHighlight | null {
  let best: CloseGameHighlight | null = null;
  for (const event of bettable(events, now)) {
    const market = moneyline(event);
    if (!market || market.outcomes.length !== 2) continue;
    const [a, b] = market.outcomes;
    const spread = Math.abs(
      impliedProbability(a.priceAmerican) - impliedProbability(b.priceAmerican),
    );
    if (best === null || spread < best.spread) {
      best = {
        event,
        outcomes: [
          { name: a.name, priceAmerican: a.priceAmerican },
          { name: b.name, priceAmerican: b.priceAmerican },
        ],
        spread,
      };
    }
  }
  return best;
}
