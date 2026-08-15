/**
 * The hero taglines, one drawn per visit.
 *
 * Written to sound like a person and not a positioning statement. The draw
 * happens on the server in page.tsx, once per request: the page is already
 * force-dynamic for the session check, so a returning visitor gets a fresh
 * line for free and hydration never sees two different choices.
 */
export const HERO_TAGLINES: string[] = [
  "Ten minutes is all most people give a portfolio. This one argues from shipped work and the write-ups behind it.",
  "The resume says lead frontend developer. The fifteen working apps on this domain say it louder.",
  "I could put adjectives here. Instead the whole site is the take-home, already done and already tested.",
  "Most portfolios are screenshots. This one runs, measures its own Web Vitals, and owns its mistakes in writing.",
  "Built test-first, measured on real users, and yes, one of the old landing pages is a slot machine. I stand by it.",
];

/**
 * Turns one random draw into a tagline index.
 * @param random A function returning a number in [0, 1), injected for tests.
 */
export function pickTaglineIndex(random: () => number): number {
  return Math.floor(random() * HERO_TAGLINES.length) % HERO_TAGLINES.length;
}
