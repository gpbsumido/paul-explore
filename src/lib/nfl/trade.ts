/**
 * The trade analyzer's model. It reads every rostered player in the league
 * with ESPN's projections, the NFL schedule, and ESPN's points-allowed ratings
 * by position, then scores a trade by what each side can actually start.
 *
 * Raw projection totals flatter the side that receives more bodies -- a
 * 2-for-1 always "wins" on a sum -- so every horizon here is the change in
 * each team's best possible lineup, week by week, with byes counted.
 */
import { z } from "zod";
import { ownerName } from "./matchups";

// ---- Normalized shapes ----

export interface TradePlayer {
  playerId: number;
  name: string;
  positionId: number;
  proTeamId: number;
  fantasyTeamId: number;
  injuryStatus: string;
  /** ESPN lineup slot ids this player may fill. */
  eligibleSlots: number[];
  /** ESPN's projection for the current week. */
  thisWeek: number;
  /** Projected points per game for each game after this week. */
  perGame: number;
  /** Week -> opponent proTeamId for each remaining fantasy week with a game. */
  opponents: Record<string, number>;
  /** Mean opponent rank against the position over those weeks (1 hardest, 32 easiest). */
  sosRank: number | null;
}

export interface TradeTeam {
  teamId: number;
  name: string;
  ownerName: string;
}

export interface TradePool {
  season: number;
  currentWeek: number;
  /** The fantasy season's last scoring period. */
  finalWeek: number;
  /** Starting lineup slot id -> how many of it. */
  slotCounts: Record<string, number>;
  teams: TradeTeam[];
  players: TradePlayer[];
}

// ---- Parsing ----

const statSchema = z.object({
  id: z.string().optional(),
  scoringPeriodId: z.number().optional(),
  seasonId: z.number().optional(),
  statSourceId: z.number().optional(),
  statSplitTypeId: z.number().optional(),
  appliedTotal: z.number().optional(),
});

const poolEntrySchema = z.object({
  onTeamId: z.number(),
  player: z.object({
    id: z.number(),
    fullName: z.string().min(1),
    defaultPositionId: z.number().optional(),
    proTeamId: z.number().optional(),
    injuryStatus: z.string().optional(),
    eligibleSlots: z.array(z.number()).optional(),
    stats: z.array(statSchema).optional(),
  }),
});

const ratingSchema = z.object({ rank: z.number() });

const leagueSchema = z.object({
  scoringPeriodId: z.number().optional(),
  status: z
    .object({
      currentMatchupPeriod: z.number().optional(),
      finalScoringPeriod: z.number().optional(),
    })
    .optional(),
  settings: z
    .object({
      rosterSettings: z
        .object({ lineupSlotCounts: z.record(z.string(), z.number()).optional() })
        .optional(),
    })
    .optional(),
  members: z
    .array(
      z.object({
        id: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        displayName: z.string().optional(),
      }),
    )
    .optional(),
  teams: z
    .array(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        owners: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  players: z.array(z.unknown()).optional(),
  positionAgainstOpponent: z
    .object({
      positionalRatings: z
        .record(
          z.string(),
          z.object({ ratingsByOpponent: z.record(z.string(), ratingSchema).optional() }),
        )
        .optional(),
    })
    .optional(),
});

const gameSchema = z.object({
  awayProTeamId: z.number(),
  homeProTeamId: z.number(),
});

const schedulesSchema = z.object({
  settings: z.object({
    proTeams: z.array(
      z.object({
        id: z.number(),
        proGamesByScoringPeriod: z.record(z.string(), z.array(gameSchema)).optional(),
      }),
    ),
  }),
});

/** Bench and IR sit outside the lineup. */
const NON_LINEUP_SLOTS = new Set(["20", "21"]);

/** proTeamId -> week -> opponent proTeamId, for every scheduled NFL game. */
function opponentsByTeam(schedules: unknown): Map<number, Map<number, number>> {
  const out = new Map<number, Map<number, number>>();
  const parsed = schedulesSchema.safeParse(schedules);
  if (!parsed.success) return out;

  for (const team of parsed.data.settings.proTeams) {
    const weeks = new Map<number, number>();
    for (const [week, games] of Object.entries(team.proGamesByScoringPeriod ?? {})) {
      const g = games[0];
      if (!g) continue;
      weeks.set(Number(week), g.awayProTeamId === team.id ? g.homeProTeamId : g.awayProTeamId);
    }
    out.set(team.id, weeks);
  }
  return out;
}

type Stat = z.infer<typeof statSchema>;

/** This week's projection: source 1 (projected), split 1 (weekly). */
function weekProjection(stats: Stat[], week: number): number {
  return (
    stats.find(
      (s) => s.scoringPeriodId === week && s.statSourceId === 1 && s.statSplitTypeId === 1,
    )?.appliedTotal ?? 0
  );
}

/**
 * ESPN's rest-of-season projection: source 1, split 0, period 0, this season.
 * Its total runs from the current week to the end of the NFL season and
 * already prices in games ESPN expects a player to miss.
 */
function restOfSeasonTotal(stats: Stat[], season: number): number {
  return (
    stats.find(
      (s) =>
        s.seasonId === season &&
        s.scoringPeriodId === 0 &&
        s.statSourceId === 1 &&
        s.statSplitTypeId === 0,
    )?.appliedTotal ?? 0
  );
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Normalize the league's rostered player pool and NFL schedule into a
 * TradePool. Anything malformed degrades to an empty pool rather than a throw.
 */
export function parseTradePool(
  league: unknown,
  schedules: unknown,
  season: number,
): TradePool {
  const parsed = leagueSchema.safeParse(league);
  if (!parsed.success) {
    return { season, currentWeek: 1, finalWeek: 17, slotCounts: {}, teams: [], players: [] };
  }

  const data = parsed.data;
  const currentWeek = data.scoringPeriodId ?? data.status?.currentMatchupPeriod ?? 1;
  const finalWeek = data.status?.finalScoringPeriod ?? 17;
  const members = data.members ?? [];
  const ratings = data.positionAgainstOpponent?.positionalRatings ?? {};
  const schedule = opponentsByTeam(schedules);

  const slotCounts = Object.fromEntries(
    Object.entries(data.settings?.rosterSettings?.lineupSlotCounts ?? {}).filter(
      ([slot, count]) => count > 0 && !NON_LINEUP_SLOTS.has(slot),
    ),
  );

  const teams = (data.teams ?? []).map((t) => ({
    teamId: t.id,
    name: t.name ?? `Team ${t.id}`,
    ownerName: ownerName(t, members),
  }));

  const players: TradePlayer[] = [];
  for (const raw of data.players ?? []) {
    const entry = poolEntrySchema.safeParse(raw);
    if (!entry.success || entry.data.onTeamId <= 0) continue;
    const p = entry.data.player;
    const stats = p.stats ?? [];
    const proTeamId = p.proTeamId ?? 0;
    const positionId = p.defaultPositionId ?? 0;
    const games = schedule.get(proTeamId) ?? new Map<number, number>();

    const thisWeek = weekProjection(stats, currentWeek);
    const gamesLeft = [...games.keys()].filter((w) => w > currentWeek).length;
    const perGame =
      gamesLeft > 0 ? Math.max(0, restOfSeasonTotal(stats, season) - thisWeek) / gamesLeft : 0;

    const opponents: Record<string, number> = {};
    for (const [week, opp] of games) {
      if (week > currentWeek && week <= finalWeek) opponents[String(week)] = opp;
    }

    const positionRatings = ratings[String(positionId)]?.ratingsByOpponent ?? {};
    const ranks = Object.values(opponents)
      .map((opp) => positionRatings[String(opp)]?.rank)
      .filter((r): r is number => r !== undefined);

    players.push({
      playerId: p.id,
      name: p.fullName,
      positionId,
      proTeamId,
      fantasyTeamId: entry.data.onTeamId,
      injuryStatus: p.injuryStatus ?? "ACTIVE",
      eligibleSlots: p.eligibleSlots ?? [],
      thisWeek,
      perGame,
      opponents,
      sosRank: mean(ranks),
    });
  }

  return { season, currentWeek, finalWeek, slotCounts, teams, players };
}

// ---- Lineups ----

/**
 * The most points a roster can start. Slots are filled narrowest first (fewest
 * eligible players), each with the best player left. For ESPN's football slots
 * that's optimal: each position slot is its own pool, FLEX sits inside OP,
 * and a narrower pool can only lose by waiting for a wider one.
 */
export function optimalLineupPoints(
  players: { eligibleSlots: number[]; value: number }[],
  slotCounts: Record<string, number>,
): number {
  const slots = Object.entries(slotCounts)
    .map(([slot, count]) => ({
      slot: Number(slot),
      count,
      breadth: players.filter((p) => p.eligibleSlots.includes(Number(slot))).length,
    }))
    .sort((a, b) => a.breadth - b.breadth);

  const available = [...players].sort((a, b) => b.value - a.value);
  let total = 0;
  for (const { slot, count } of slots) {
    for (let i = 0; i < count; i++) {
      const pick = available.findIndex((p) => p.eligibleSlots.includes(slot));
      if (pick === -1) break;
      total += available[pick].value;
      available.splice(pick, 1);
    }
  }
  return total;
}

/** A player's projected points in a given week: this week's line, else per game unless a bye. */
function valueInWeek(player: TradePlayer, week: number, currentWeek: number): number {
  if (week === currentWeek) return player.thisWeek;
  return player.opponents[String(week)] !== undefined ? player.perGame : 0;
}

function lineupOverWeeks(pool: TradePool, roster: TradePlayer[], weeks: number[]): number {
  return weeks.reduce(
    (sum, week) =>
      sum +
      optimalLineupPoints(
        roster.map((p) => ({
          eligibleSlots: p.eligibleSlots,
          value: valueInWeek(p, week, pool.currentWeek),
        })),
        pool.slotCounts,
      ),
    0,
  );
}

// ---- Trades ----

export interface Trade {
  teamA: number;
  teamB: number;
  /** Player ids team A sends. */
  fromA: number[];
  /** Player ids team B sends. */
  fromB: number[];
}

export interface SideChange {
  before: number;
  after: number;
  delta: number;
}

export interface TradeHorizon {
  key: "thisWeek" | "nextWeek" | "restOfSeason";
  label: string;
  /** Inclusive [first, last] week; last < first when the horizon is empty. */
  weeks: [number, number];
  a: SideChange;
  b: SideChange;
  winner: "A" | "B" | "even";
  /** Team A's change minus team B's: the swing between the two sides. */
  margin: number;
}

export interface TradeResult {
  horizons: TradeHorizon[];
  /** Mean SOS rank of what each side receives (1 hardest, 32 easiest). */
  sos: { aReceives: number | null; bReceives: number | null };
}

/** Under half a point either way is noise, not a winner. */
const EVEN_MARGIN = 0.5;

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Score a trade for both sides over this week, next week, and the rest of the season. */
export function evaluateTrade(pool: TradePool, trade: Trade): TradeResult {
  const sendsA = new Set(trade.fromA);
  const sendsB = new Set(trade.fromB);
  const rosterOf = (teamId: number) => pool.players.filter((p) => p.fantasyTeamId === teamId);

  const aBefore = rosterOf(trade.teamA);
  const bBefore = rosterOf(trade.teamB);
  const aGets = bBefore.filter((p) => sendsB.has(p.playerId));
  const bGets = aBefore.filter((p) => sendsA.has(p.playerId));
  const aAfter = [...aBefore.filter((p) => !sendsA.has(p.playerId)), ...aGets];
  const bAfter = [...bBefore.filter((p) => !sendsB.has(p.playerId)), ...bGets];

  const next = pool.currentWeek + 1;
  const spans: { key: TradeHorizon["key"]; label: string; weeks: [number, number] }[] = [
    { key: "thisWeek", label: "This week", weeks: [pool.currentWeek, pool.currentWeek] },
    { key: "nextWeek", label: "Next week", weeks: [next, Math.min(next, pool.finalWeek)] },
    { key: "restOfSeason", label: "Rest of season", weeks: [next, pool.finalWeek] },
  ];

  const change = (before: TradePlayer[], after: TradePlayer[], weeks: number[]): SideChange => {
    const b = round1(lineupOverWeeks(pool, before, weeks));
    const a = round1(lineupOverWeeks(pool, after, weeks));
    return { before: b, after: a, delta: round1(a - b) };
  };

  const horizons = spans.map(({ key, label, weeks }) => {
    const span = range(weeks[0], weeks[1]);
    const a = change(aBefore, aAfter, span);
    const b = change(bBefore, bAfter, span);
    const margin = round1(a.delta - b.delta);
    const winner: TradeHorizon["winner"] =
      Math.abs(margin) < EVEN_MARGIN ? "even" : margin > 0 ? "A" : "B";
    return { key, label, weeks, a, b, winner, margin };
  });

  const sosOf = (players: TradePlayer[]) =>
    mean(players.map((p) => p.sosRank).filter((r): r is number => r !== null));

  return { horizons, sos: { aReceives: sosOf(aGets), bReceives: sosOf(bGets) } };
}
