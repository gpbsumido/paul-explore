import { z } from "zod";

/**
 * The ZeroProof read models, mirrored from the backend DTOs
 * (portfolio_api src/modules/zeroproof). Only the two public endpoints the
 * read-only lobby needs are modelled here: the events slate and the
 * leaderboard. Money is always integer cents, timestamps are ISO strings, and
 * `market` / `status` are text columns on the backend, so they stay `string`
 * here rather than a strict enum that a new value would break the whole page on.
 */

export const outcomeSchema = z.object({
  name: z.string(),
  priceAmerican: z.number(),
  // absent (not null) for moneyline; present for spread/total
  point: z.number().optional(),
});

export const marketSchema = z.object({
  market: z.string(), // 'h2h' | 'spread' | 'total'
  fetchedAt: z.string(),
  outcomes: z.array(outcomeSchema),
});

export const eventSchema = z.object({
  id: z.string(),
  sport: z.string(),
  home: z.string(),
  away: z.string(),
  commenceTime: z.string(),
  status: z.string(), // 'upcoming' | 'final'
  markets: z.array(marketSchema),
});

export const eventsResponseSchema = z.object({
  events: z.array(eventSchema),
});

export const leaderboardEntrySchema = z.object({
  userSub: z.string(),
  wins: z.number(),
  losses: z.number(),
  pushes: z.number(),
  betCount: z.number(),
  roiPct: z.number(),
  // null below the minimum graded-bet threshold
  sharpScore: z.number().nullable(),
});

// The proxy unwraps the backend's { board, entries } to just { entries }.
export const leaderboardResponseSchema = z.object({
  entries: z.array(leaderboardEntrySchema),
});

// The signed-in player's profile: stats, wallets, and earned accolades. Money
// is integer cents; timestamps are ISO strings; clvAvgPct and sharpScore are
// null until enough graded bets carry them.
export const walletSchema = z.object({
  id: z.string(),
  mode: z.string(), // 'season' | 'challenge'
  principalCents: z.number(),
  balanceCents: z.number(),
  lockStart: z.string(),
  lockEnd: z.string(),
  status: z.string(), // 'active' | 'busted' | 'refunded'
  createdAt: z.string(),
});

export const profileStatsSchema = z.object({
  wins: z.number(),
  losses: z.number(),
  pushes: z.number(),
  betCount: z.number(),
  roiPct: z.number(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  biggestHitCents: z.number(),
  clvAvgPct: z.number().nullable(),
  sharpScore: z.number().nullable(),
});

export const accoladeSchema = z.object({
  id: z.string(),
  name: z.string(),
  awardedAt: z.string(),
});

export const profileResponseSchema = z.object({
  stats: profileStatsSchema,
  wallets: z.array(walletSchema),
  accolades: z.array(accoladeSchema),
});

export type ZeroproofMarket = z.infer<typeof marketSchema>;
// The read-model types the ZeroProof lobby/leaderboard consume. They land a
// stacked PR ahead of their first import, so the dead-code check would flag
// them until the frontend merges.
// ts-prune-ignore-next
export type ZeroproofEvent = z.infer<typeof eventSchema>;
// ts-prune-ignore-next
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
// A placed bet: the selection and odds locked at placement, plus the closing
// odds and closing-line value the settler stamps once it grades.
export const betSchema = z.object({
  id: z.string(),
  walletId: z.string(),
  eventId: z.string(),
  market: z.string(),
  selection: z.string(),
  oddsAmerican: z.number(),
  lineValue: z.number().nullable(),
  closingOddsAmerican: z.number().nullable(),
  clv: z.number().nullable(),
  stakeCents: z.number(),
  status: z.string(), // 'open' | 'won' | 'lost' | 'push' | 'void'
  placedAt: z.string(),
  settledAt: z.string().nullable(),
});

export const betsResponseSchema = z.object({
  bets: z.array(betSchema),
});

export type ProfileStats = z.infer<typeof profileStatsSchema>;
export type ZeroproofWallet = z.infer<typeof walletSchema>;
export type Accolade = z.infer<typeof accoladeSchema>;
export type ZeroproofBet = z.infer<typeof betSchema>;
