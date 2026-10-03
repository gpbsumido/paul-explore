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
import { ESPN_NFL_POSITION } from "@/types/espn-nfl";
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
  /** Projected receptions this week, and per game after it (what PPR scores). */
  recThisWeek: number;
  recPerGame: number;
  /** In an IR slot, so not taking up one of the roster's spots. */
  onIr: boolean;
  droppable: boolean;
  tradeLocked: boolean;
}

/** The league's real scoring, read from its settings. */
export interface LeagueFormat {
  teams: number;
  /** Points per reception: 1 full PPR, 0.5 half, 0 standard. */
  ppr: number;
  /** Extra points per reception for tight ends. */
  tePremium: number;
  passTdPoints: number;
  superflex: boolean;
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
  format: LeagueFormat;
  /** Players a roster holds outside IR, or null when the league didn't say. */
  rosterMax: number | null;
  /** Position id -> most players of it a roster may hold. */
  positionLimits: Record<string, number>;
  /** The best-owned free agents and waiver players, for pickups and the replacement baseline. */
  freeAgents: TradePlayer[];
}

// ---- Parsing ----

const statSchema = z.object({
  id: z.string().optional(),
  scoringPeriodId: z.number().optional(),
  seasonId: z.number().optional(),
  statSourceId: z.number().optional(),
  statSplitTypeId: z.number().optional(),
  appliedTotal: z.number().optional(),
  /** Raw projected stats by ESPN stat id; 53 is receptions. */
  stats: z.record(z.string(), z.number()).optional(),
});

const poolEntrySchema = z.object({
  onTeamId: z.number(),
  tradeLocked: z.boolean().optional(),
  player: z.object({
    droppable: z.boolean().optional(),
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
      size: z.number().optional(),
      rosterSettings: z
        .object({
          lineupSlotCounts: z.record(z.string(), z.number()).optional(),
          positionLimits: z.record(z.string(), z.number()).optional(),
        })
        .optional(),
      scoringSettings: z
        .object({
          scoringItems: z
            .array(
              z.object({
                statId: z.number(),
                points: z.number().optional(),
                pointsOverrides: z.record(z.string(), z.number()).optional(),
              }),
            )
            .optional(),
        })
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
        roster: z
          .object({
            entries: z
              .array(z.object({ playerId: z.number(), lineupSlotId: z.number().optional() }))
              .optional(),
          })
          .optional(),
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
const IR_SLOT = 21;
const IR_SLOT_KEY = "21";
const OP_SLOT_KEY = "7";
/** ESPN stat ids: receptions (what PPR scores) and passing touchdowns. */
const RECEPTIONS = "53";
const PASS_TD = 4;
const TE_POSITION = 4;
const freeAgentsSchema = z.object({ players: z.array(z.unknown()).optional() });

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

/** This week's projection line: source 1 (projected), split 1 (weekly). */
function weekProjectionStat(stats: Stat[], week: number): Stat | undefined {
  return stats.find(
    (s) => s.scoringPeriodId === week && s.statSourceId === 1 && s.statSplitTypeId === 1,
  );
}

/**
 * ESPN's rest-of-season projection: source 1, split 0, period 0, this season.
 * Its total runs from the current week to the end of the NFL season and
 * already prices in games ESPN expects a player to miss.
 */
function restOfSeasonStat(stats: Stat[], season: number): Stat | undefined {
  return stats.find(
    (s) =>
      s.seasonId === season &&
      s.scoringPeriodId === 0 &&
      s.statSourceId === 1 &&
      s.statSplitTypeId === 0,
  );
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

type LeagueData = z.infer<typeof leagueSchema>;

/** The league's real scoring, from its settings. */
function readFormat(data: LeagueData): LeagueFormat {
  const items = data.settings?.scoringSettings?.scoringItems ?? [];
  const reception = items.find((item) => String(item.statId) === RECEPTIONS);
  const ppr = reception?.points ?? 0;
  // ESPN keys position overrides inconsistently (TE as position 4 or slot 6),
  // so either one counts as a tight-end premium.
  const overrides = reception?.pointsOverrides ?? {};
  const teOverride = overrides["4"] ?? overrides["6"];
  return {
    teams: data.settings?.size ?? data.teams?.length ?? 0,
    ppr,
    tePremium: teOverride === undefined ? 0 : teOverride - ppr,
    passTdPoints: items.find((item) => item.statId === PASS_TD)?.points ?? 0,
    superflex: (data.settings?.rosterSettings?.lineupSlotCounts?.[OP_SLOT_KEY] ?? 0) > 0,
  };
}

interface PlayerContext {
  season: number;
  currentWeek: number;
  finalWeek: number;
  ratings: NonNullable<NonNullable<LeagueData["positionAgainstOpponent"]>["positionalRatings"]>;
  schedule: Map<number, Map<number, number>>;
  irPlayerIds: Set<number>;
}

/** One ESPN player-pool entry, rostered or free, as a TradePlayer. */
function parsePlayer(raw: unknown, ctx: PlayerContext): TradePlayer | null {
  const entry = poolEntrySchema.safeParse(raw);
  if (!entry.success) return null;
  const p = entry.data.player;
  const stats = p.stats ?? [];
  const proTeamId = p.proTeamId ?? 0;
  const positionId = p.defaultPositionId ?? 0;
  const games = ctx.schedule.get(proTeamId) ?? new Map<number, number>();

  const week = weekProjectionStat(stats, ctx.currentWeek);
  const ros = restOfSeasonStat(stats, ctx.season);
  const thisWeek = week?.appliedTotal ?? 0;
  const recThisWeek = week?.stats?.[RECEPTIONS] ?? 0;
  const gamesLeft = [...games.keys()].filter((w) => w > ctx.currentWeek).length;
  const perFutureGame = (total: number, now: number) =>
    gamesLeft > 0 ? Math.max(0, total - now) / gamesLeft : 0;

  const opponents: Record<string, number> = {};
  for (const [w, opp] of games) {
    if (w > ctx.currentWeek && w <= ctx.finalWeek) opponents[String(w)] = opp;
  }

  const positionRatings = ctx.ratings[String(positionId)]?.ratingsByOpponent ?? {};
  const ranks = Object.values(opponents)
    .map((opp) => positionRatings[String(opp)]?.rank)
    .filter((r): r is number => r !== undefined);

  return {
    playerId: p.id,
    name: p.fullName,
    positionId,
    proTeamId,
    fantasyTeamId: Math.max(0, entry.data.onTeamId),
    injuryStatus: p.injuryStatus ?? "ACTIVE",
    eligibleSlots: p.eligibleSlots ?? [],
    thisWeek,
    perGame: perFutureGame(ros?.appliedTotal ?? 0, thisWeek),
    opponents,
    sosRank: mean(ranks),
    recThisWeek,
    recPerGame: perFutureGame(ros?.stats?.[RECEPTIONS] ?? 0, recThisWeek),
    onIr: ctx.irPlayerIds.has(p.id),
    droppable: p.droppable ?? true,
    tradeLocked: entry.data.tradeLocked ?? false,
  };
}

/**
 * Normalize the league's rostered player pool, its settings, the NFL schedule
 * and the free-agent pool into a TradePool. Anything malformed degrades to an
 * empty pool rather than a throw.
 */
export function parseTradePool(
  league: unknown,
  schedules: unknown,
  season: number,
  freeAgents?: unknown,
): TradePool {
  const parsed = leagueSchema.safeParse(league);
  if (!parsed.success) {
    return {
      season,
      currentWeek: 1,
      finalWeek: 17,
      slotCounts: {},
      teams: [],
      players: [],
      format: { teams: 0, ppr: 0, tePremium: 0, passTdPoints: 0, superflex: false },
      rosterMax: null,
      positionLimits: {},
      freeAgents: [],
    };
  }

  const data = parsed.data;
  const members = data.members ?? [];
  const rawSlots = data.settings?.rosterSettings?.lineupSlotCounts ?? {};

  const slotCounts = Object.fromEntries(
    Object.entries(rawSlots).filter(([slot, count]) => count > 0 && !NON_LINEUP_SLOTS.has(slot)),
  );
  const rosterSlots = Object.entries(rawSlots).filter(([slot]) => slot !== IR_SLOT_KEY);
  const rosterMax =
    rosterSlots.length > 0 ? rosterSlots.reduce((sum, [, count]) => sum + Math.max(0, count), 0) : null;
  const positionLimits = Object.fromEntries(
    Object.entries(data.settings?.rosterSettings?.positionLimits ?? {}).filter(([, limit]) => limit > 0),
  );

  const teams = (data.teams ?? []).map((t) => ({
    teamId: t.id,
    name: t.name ?? `Team ${t.id}`,
    ownerName: ownerName(t, members),
  }));

  const ctx: PlayerContext = {
    season,
    currentWeek: data.scoringPeriodId ?? data.status?.currentMatchupPeriod ?? 1,
    finalWeek: data.status?.finalScoringPeriod ?? 17,
    ratings: data.positionAgainstOpponent?.positionalRatings ?? {},
    schedule: opponentsByTeam(schedules),
    irPlayerIds: new Set(
      (data.teams ?? []).flatMap((t) =>
        (t.roster?.entries ?? []).filter((e) => e.lineupSlotId === IR_SLOT).map((e) => e.playerId),
      ),
    ),
  };

  const players = (data.players ?? [])
    .map((raw) => parsePlayer(raw, ctx))
    .filter((p): p is TradePlayer => p !== null && p.fantasyTeamId > 0);

  const faParsed = freeAgentsSchema.safeParse(freeAgents);
  const pool = faParsed.success ? (faParsed.data.players ?? []) : [];
  const free = pool
    .map((raw) => parsePlayer(raw, ctx))
    .filter((p): p is TradePlayer => p !== null && p.fantasyTeamId === 0);

  return {
    season,
    currentWeek: ctx.currentWeek,
    finalWeek: ctx.finalWeek,
    slotCounts,
    teams,
    players,
    format: readFormat(data),
    rosterMax,
    positionLimits,
    freeAgents: free,
  };
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

// ---- Scoring ----

/** How to score the trade: the league's own format, or a what-if. */
export interface ScoringOptions {
  ppr: number;
  tePremium: number;
  superflex: boolean;
}

/** The league's real format, as scoring options. */
export function leagueScoring(format: LeagueFormat): ScoringOptions {
  return { ppr: format.ppr, tePremium: format.tePremium, superflex: format.superflex };
}

/**
 * Everything a week's lineup needs to know about the scoring: ESPN's numbers
 * are already the league's real format, so a what-if only adds the difference,
 * per projected reception (and per TE reception for the premium). Superflex is
 * a lineup slot, not points, so it changes the slots instead.
 */
interface Scorer {
  currentWeek: number;
  slots: Record<string, number>;
  pprDelta: number;
  teDelta: number;
}

function makeScorer(pool: TradePool, scoring: ScoringOptions): Scorer {
  const slots = { ...pool.slotCounts };
  if (scoring.superflex !== pool.format.superflex) {
    if (scoring.superflex) slots[OP_SLOT_KEY] = 1;
    else delete slots[OP_SLOT_KEY];
  }
  return {
    currentWeek: pool.currentWeek,
    slots,
    pprDelta: scoring.ppr - pool.format.ppr,
    teDelta: scoring.tePremium - pool.format.tePremium,
  };
}

/** A player's projected points in a given week: this week's line, else per game unless a bye. */
function valueInWeek(player: TradePlayer, week: number, scorer: Scorer): number {
  const current = week === scorer.currentWeek;
  if (!current && player.opponents[String(week)] === undefined) return 0;
  const base = current ? player.thisWeek : player.perGame;
  const receptions = current ? player.recThisWeek : player.recPerGame;
  const perReception = scorer.pprDelta + (player.positionId === TE_POSITION ? scorer.teDelta : 0);
  return base + perReception * receptions;
}

function lineupOverWeeks(scorer: Scorer, roster: TradePlayer[], weeks: number[]): number {
  return weeks.reduce(
    (sum, week) =>
      sum +
      optimalLineupPoints(
        roster.map((p) => ({ eligibleSlots: p.eligibleSlots, value: valueInWeek(p, week, scorer) })),
        scorer.slots,
      ),
    0,
  );
}

// ---- Roster spots ----

/** Not worth picking up: they won't play soon enough to count. */
const UNAVAILABLE = new Set(["OUT", "INJURY_RESERVE", "SUSPENSION"]);

export interface RosterMove {
  kind: "drop" | "add";
  playerId: number;
  name: string;
  positionId: number;
  /** What the move does to the lineup over the horizon: a pickup's gain, a drop's loss (as a negative). */
  points: number;
}

/** Players taking up a roster spot (IR doesn't). */
function spotsUsed(roster: TradePlayer[]): number {
  return roster.filter((p) => !p.onIr).length;
}

/** The roster spots a trade opens or overfills, beyond any that were already open. */
function spotChanges(pool: TradePool, before: TradePlayer[], after: TradePlayer[]) {
  if (pool.rosterMax === null) return { opened: 0, forced: 0 };
  const max = pool.rosterMax;
  const open = (r: TradePlayer[]) => Math.max(0, max - spotsUsed(r));
  const over = (r: TradePlayer[]) => Math.max(0, spotsUsed(r) - max);
  return {
    opened: Math.max(0, open(after) - open(before)),
    forced: Math.max(0, over(after) - over(before)),
  };
}

function withinLimit(pool: TradePool, roster: TradePlayer[], player: TradePlayer): boolean {
  const limit = pool.positionLimits[String(player.positionId)];
  if (limit === undefined) return true;
  return roster.filter((p) => p.positionId === player.positionId).length < limit;
}

/** Positive zero, so a free drop reads 0 rather than -0. */
function lossPoints(loss: number): number {
  const rounded = round1(loss);
  return rounded === 0 ? 0 : -rounded;
}

/**
 * Fill or trim a post-trade roster back to its size, for the spots the trade
 * itself caused: drop whoever costs the lineup least (never someone who can't
 * be dropped), pick up whichever healthy free agent the lineup gains most from.
 * Greedy, one spot at a time.
 *
 * A pickup has to come from a position the side traded away. Any other upgrade
 * on the wire (a better kicker, say) was there before the trade too, and the
 * team could already have swapped a bench player for it, so crediting it to the
 * trade would overstate what the trade did.
 */
function settleRoster(
  pool: TradePool,
  scorer: Scorer,
  before: TradePlayer[],
  after: TradePlayer[],
  sent: TradePlayer[],
  weeks: number[],
): { roster: TradePlayer[]; moves: RosterMove[] } {
  const sentPositions = new Set(sent.map((p) => p.positionId));
  const { opened, forced } = spotChanges(pool, before, after);
  let roster = after;
  const moves: RosterMove[] = [];
  const points = (r: TradePlayer[]) => lineupOverWeeks(scorer, r, weeks);

  for (let i = 0; i < forced; i++) {
    const current = points(roster);
    const candidates = roster
      .filter((p) => !p.onIr && p.droppable)
      .map((p) => ({ p, loss: current - points(roster.filter((q) => q !== p)) }))
      .sort((x, y) => x.loss - y.loss || x.p.perGame - y.p.perGame || x.p.playerId - y.p.playerId);
    const drop = candidates[0];
    if (!drop) break;
    roster = roster.filter((q) => q !== drop.p);
    moves.push({ kind: "drop", playerId: drop.p.playerId, name: drop.p.name, positionId: drop.p.positionId, points: lossPoints(drop.loss) });
  }

  for (let i = 0; i < opened; i++) {
    const current = points(roster);
    const taken = new Set(roster.map((p) => p.playerId));
    const candidates = pool.freeAgents
      .filter(
        (p) =>
          !taken.has(p.playerId) &&
          sentPositions.has(p.positionId) &&
          !UNAVAILABLE.has(p.injuryStatus) &&
          withinLimit(pool, roster, p),
      )
      .map((p) => ({ p, gain: points([...roster, p]) - current }))
      .sort((x, y) => y.gain - x.gain || y.p.perGame - x.p.perGame || x.p.playerId - y.p.playerId);
    const add = candidates[0];
    if (!add) break;
    roster = [...roster, add.p];
    moves.push({ kind: "add", playerId: add.p.playerId, name: add.p.name, positionId: add.p.positionId, points: round1(add.gain) });
  }

  return { roster, moves };
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

export type Winner = "A" | "B" | "even";

export interface TradeHorizon {
  key: "thisWeek" | "nextWeek" | "restOfSeason";
  label: string;
  /** Inclusive [first, last] week; last < first when the horizon is empty. */
  weeks: [number, number];
  a: SideChange;
  b: SideChange;
  winner: Winner;
  /** Team A's change minus team B's: the swing between the two sides. */
  margin: number;
  /** The drops and pickups the trade forces on each side over this horizon. */
  moves: { a: RosterMove[]; b: RosterMove[] };
}

export interface TradeResult {
  horizons: TradeHorizon[];
  /** Mean SOS rank of what each side receives (1 hardest, 32 easiest). */
  sos: { aReceives: number | null; bReceives: number | null };
  /**
   * Rest of season, roster-blind: points each side receives above the best
   * free agent at the position, week by week, net of what it sends.
   */
  value: { a: number; b: number; winner: Winner; margin: number };
  /** Things that would stop the trade going through, flagged rather than blocked. */
  warnings: string[];
}

/** Within half a point a week is noise, not a winner. */
const EVEN_PER_WEEK = 0.5;

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function winnerOf(margin: number, weeks: number): Winner {
  if (Math.abs(margin) < EVEN_PER_WEEK * Math.max(1, weeks)) return "even";
  return margin > 0 ? "A" : "B";
}

/** Points above the best healthy free agent at the position, summed over the weeks. */
function valueOverWaiver(pool: TradePool, scorer: Scorer, players: TradePlayer[], weeks: number[]): number {
  const available = pool.freeAgents.filter((p) => !UNAVAILABLE.has(p.injuryStatus));
  const replacement = (positionId: number, week: number) =>
    Math.max(0, ...available.filter((p) => p.positionId === positionId).map((p) => valueInWeek(p, week, scorer)));
  return players.reduce(
    (sum, p) =>
      sum + weeks.reduce((s, w) => s + Math.max(0, valueInWeek(p, w, scorer) - replacement(p.positionId, w)), 0),
    0,
  );
}

function positionLabel(positionId: number): string {
  return ESPN_NFL_POSITION[positionId] ?? `position ${positionId}`;
}

function tradeWarnings(
  pool: TradePool,
  traded: TradePlayer[],
  sides: { teamId: number; before: TradePlayer[]; after: TradePlayer[] }[],
): string[] {
  const warnings = traded.filter((p) => p.tradeLocked).map((p) => `${p.name} is trade-locked.`);
  for (const { teamId, before, after } of sides) {
    const team = pool.teams.find((t) => t.teamId === teamId)?.name ?? `Team ${teamId}`;
    for (const [position, limit] of Object.entries(pool.positionLimits)) {
      const count = after.filter((p) => String(p.positionId) === position).length;
      if (count > limit) {
        warnings.push(`${team} would have ${count} ${positionLabel(Number(position))}s (limit ${limit}).`);
      }
    }
    const { forced } = spotChanges(pool, before, after);
    if (forced > 0 && !after.some((p) => !p.onIr && p.droppable)) {
      warnings.push(`${team} would need a drop, but nobody on the roster can be dropped.`);
    }
  }
  return warnings;
}

/**
 * Score a trade for both sides over this week, next week, and the rest of the
 * season, under the league's format unless a what-if is given. Each side's
 * roster is settled first: the drops and pickups the trade forces are part of
 * what it's worth.
 */
export function evaluateTrade(
  pool: TradePool,
  trade: Trade,
  scoring: ScoringOptions = leagueScoring(pool.format),
): TradeResult {
  const scorer = makeScorer(pool, scoring);
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

  const side = (before: TradePlayer[], after: TradePlayer[], sent: TradePlayer[], weeks: number[]) => {
    const settled = settleRoster(pool, scorer, before, after, sent, weeks);
    const b = round1(lineupOverWeeks(scorer, before, weeks));
    const a = round1(lineupOverWeeks(scorer, settled.roster, weeks));
    return { change: { before: b, after: a, delta: round1(a - b) }, moves: settled.moves };
  };

  const horizons = spans.map(({ key, label, weeks }) => {
    const span = range(weeks[0], weeks[1]);
    const a = side(aBefore, aAfter, bGets, span);
    const b = side(bBefore, bAfter, aGets, span);
    const margin = round1(a.change.delta - b.change.delta);
    return {
      key,
      label,
      weeks,
      a: a.change,
      b: b.change,
      winner: winnerOf(margin, span.length),
      margin,
      moves: { a: a.moves, b: b.moves },
    };
  });

  const rosWeeks = range(next, pool.finalWeek);
  const aValue = round1(
    valueOverWaiver(pool, scorer, aGets, rosWeeks) - valueOverWaiver(pool, scorer, bGets, rosWeeks),
  );
  const valueMargin = round1(aValue * 2);

  const sosOf = (players: TradePlayer[]) =>
    mean(players.map((p) => p.sosRank).filter((r): r is number => r !== null));

  return {
    horizons,
    sos: { aReceives: sosOf(aGets), bReceives: sosOf(bGets) },
    value: { a: aValue, b: round1(-aValue) || 0, winner: winnerOf(valueMargin, rosWeeks.length), margin: valueMargin },
    warnings: tradeWarnings(pool, [...aGets, ...bGets], [
      { teamId: trade.teamA, before: aBefore, after: aAfter },
      { teamId: trade.teamB, before: bBefore, after: bAfter },
    ]),
  };
}
