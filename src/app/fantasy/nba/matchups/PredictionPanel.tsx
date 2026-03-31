"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { queryKeys } from "@/lib/queryKeys";
import type {
  ESPNTeam,
  ESPNRosterEntry,
  ESPNScheduleEntry,
} from "@/types/espn";
import { ESPN_POSITION_MAP } from "@/types/espn";

// ---- NBA team abbreviations keyed by ESPN proTeamId ----

const PRO_TEAM_ABBREV: Record<number, string> = {
  1: "ATL",
  2: "BOS",
  3: "NOP",
  4: "CHI",
  5: "CLE",
  6: "DAL",
  7: "DEN",
  8: "DET",
  9: "GSW",
  10: "HOU",
  11: "IND",
  12: "LAC",
  13: "LAL",
  14: "MIA",
  15: "MIL",
  16: "MIN",
  17: "BKN",
  18: "NYK",
  19: "ORL",
  20: "PHI",
  21: "PHX",
  22: "POR",
  23: "SAC",
  24: "SAS",
  25: "OKC",
  26: "UTA",
  27: "WAS",
  28: "TOR",
  29: "MEM",
  30: "CHA",
};

// ---- Helpers ----

/** ESPN stat id 42 = games played. */
const GP_STAT = "42";

/** Returns the Monday-Sunday date range (YYYYMMDD) for the current week. */
function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return { start: fmt(mon), end: fmt(sun) };
}

/** Formats YYYY-MM-DD to short display like "Mon 3/30". */
function shortDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * Pulls a player's per-game fantasy average from ESPN season stats.
 * Looks for the current-season stats entry (id starts with "00").
 */
function getPerGameAvg(entry: ESPNRosterEntry): number {
  const stats = entry.playerPoolEntry?.player?.stats;
  if (!stats) return 0;
  const season = stats.find((s) => s.id.startsWith("00"));
  if (!season) return 0;
  const gp = season.stats[GP_STAT] ?? 0;
  if (gp === 0) return 0;
  return season.appliedTotal / gp;
}

// ---- Types ----

interface GameInfo {
  date: string;
  opp: string;
  home: boolean;
}

type WeekSchedule = Record<number, GameInfo[]>;

/** Discount multiplier for injury statuses. OUT = 0 games, others reduce expected games. */
const INJURY_DISCOUNT: Record<string, number> = {
  OUT: 0,
  DOUBTFUL: 0.1,
  QUESTIONABLE: 0.5,
  DAY_TO_DAY: 0.75,
};

interface PlayerPrediction {
  id: number;
  name: string;
  position: string;
  avgPts: number;
  weekProjPts: number;
  games: { label: string; proj: number }[];
  confidence: number;
  start: boolean;
  injuryStatus?: string;
}

interface FreeAgent {
  id: number;
  name: string;
  team: string;
  position: string;
  avgPts: number;
  games: number;
}

interface InjuryEntry {
  name: string;
  status: "DAY_TO_DAY" | "OUT" | "QUESTIONABLE" | "DOUBTFUL";
  position: string;
}

// ---- Prediction logic ----

/** Builds start/sit using per-game average * number of games this week. */
function buildStartSit(
  entries: ESPNRosterEntry[],
  schedule: WeekSchedule,
): PlayerPrediction[] {
  const predictions = entries
    .filter((e) => e.playerPoolEntry?.player)
    .map((entry) => {
      const p = entry.playerPoolEntry.player;
      const pos = ESPN_POSITION_MAP[p.defaultPositionId] ?? "??";
      const avgPts = Math.round(getPerGameAvg(entry) * 10) / 10;
      const injury =
        p.injuryStatus && p.injuryStatus !== "ACTIVE"
          ? p.injuryStatus
          : undefined;

      // look up this player's NBA team schedule for the week
      const teamGames = p.proTeamId ? (schedule[p.proTeamId] ?? []) : [];
      const games = teamGames.map((g) => ({
        label: `${shortDate(g.date)} ${g.home ? "vs" : "@"} ${g.opp}`,
        proj: avgPts,
      }));

      // discount projection based on injury status
      const discount = injury ? (INJURY_DISCOUNT[injury] ?? 1) : 1;
      const weekProjPts =
        Math.round(avgPts * games.length * discount * 10) / 10;

      return {
        id: p.id,
        name: p.fullName,
        position: pos,
        avgPts,
        weekProjPts,
        games,
        confidence: 0,
        start: false,
        injuryStatus: injury,
      };
    })
    .sort((a, b) => b.weekProjPts - a.weekProjPts);

  // normalize confidence across the roster
  const maxProj = predictions[0]?.weekProjPts ?? 1;
  const minProj = predictions[predictions.length - 1]?.weekProjPts ?? 0;
  const range = maxProj - minProj || 1;

  // top N = start, based on active lineup slots
  const activeSlots = entries.filter((e) => e.lineupSlotId < 12).length;

  return predictions.map((p, i) => {
    const normalized = (p.weekProjPts - minProj) / range;
    const confidence = Math.round(20 + normalized * 75);
    return { ...p, confidence, start: i < activeSlots };
  });
}

/** Sum the weekly projected points for a roster's active starters. */
function rosterWeekProj(
  entries: ESPNRosterEntry[],
  schedule: WeekSchedule,
): number {
  let total = 0;
  for (const entry of entries) {
    const p = entry.playerPoolEntry?.player;
    if (!p) continue;
    // only count active lineup slots
    if (entry.lineupSlotId >= 12) continue;
    const avg = getPerGameAvg(entry);
    const games = (p.proTeamId ? (schedule[p.proTeamId] ?? []) : []).length;
    const injury =
      p.injuryStatus && p.injuryStatus !== "ACTIVE"
        ? p.injuryStatus
        : undefined;
    const discount = injury ? (INJURY_DISCOUNT[injury] ?? 1) : 1;
    total += avg * games * discount;
  }
  return Math.round(total * 10) / 10;
}

/** Weekly outlook using rank, record, and projected roster strength. */
function buildOutlook(
  userTeam: ESPNTeam | undefined,
  opponentTeam: ESPNTeam | undefined,
  schedule: WeekSchedule,
): { summary: string; stars: number; userProj: number; oppProj: number } {
  if (!opponentTeam || !userTeam)
    return {
      summary: "No opponent found for this week.",
      stars: 3,
      userProj: 0,
      oppProj: 0,
    };

  const oppWins = opponentTeam.record?.overall?.wins ?? 0;
  const oppLosses = opponentTeam.record?.overall?.losses ?? 0;
  const userRank =
    userTeam.currentProjectedRank || userTeam.rankCalculatedFinal || 1;
  const oppRank =
    opponentTeam.currentProjectedRank || opponentTeam.rankCalculatedFinal || 1;

  // projected roster totals for the week
  const userProj = rosterWeekProj(userTeam.roster?.entries ?? [], schedule);
  const oppProj = rosterWeekProj(opponentTeam.roster?.entries ?? [], schedule);
  const projDiff = userProj - oppProj;

  // stars: blend rank advantage and projection advantage
  const rankSignal = (oppRank - userRank) / 2; // positive = you're ranked higher
  const projSignal =
    projDiff > 0 ? Math.min(projDiff / 50, 1.5) : Math.max(projDiff / 50, -1.5);
  const stars = Math.max(
    1,
    Math.min(5, Math.round(3 + rankSignal * 0.5 + projSignal)),
  );

  const strength =
    oppRank <= 2
      ? "a top-tier"
      : oppRank <= 4
        ? "a solid"
        : oppRank <= 6
          ? "a mid-tier"
          : "a lower-ranked";

  const projNote =
    projDiff > 30
      ? "Your roster projects well ahead this week."
      : projDiff > 0
        ? "Slight projection edge in your favor."
        : projDiff > -30
          ? "Projections are close, could go either way."
          : "Their roster projects stronger this week.";

  const advice =
    stars >= 4
      ? "Lean into your starters."
      : stars >= 3
        ? "Category management will be key."
        : "Consider streaming for categories you're trailing in.";

  const summary = `You're ranked #${userRank} facing ${strength} opponent ranked #${oppRank} (${oppWins}-${oppLosses}). ${projNote} ${advice}`;

  return { summary, stars, userProj, oppProj };
}

/** Extracts injured players from a roster. */
function buildInjuryWatch(entries: ESPNRosterEntry[]): InjuryEntry[] {
  return entries
    .filter((e) => {
      const status = e.playerPoolEntry?.player?.injuryStatus;
      return status && status !== "ACTIVE";
    })
    .map((e) => {
      const p = e.playerPoolEntry.player;
      return {
        name: p.fullName,
        status: p.injuryStatus as InjuryEntry["status"],
        position: ESPN_POSITION_MAP[p.defaultPositionId] ?? "??",
      };
    });
}

// ---- Sub-components ----

/** Thin confidence bar with red-yellow-green gradient. */
function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? "#22c55e" : value >= 45 ? "#eab308" : "#ef4444";

  return (
    <div className="h-1 w-full max-w-[80px] rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}

/** Filled or empty star. */
function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "#eab308" : "none"}
      stroke={filled ? "#eab308" : "currentColor"}
      strokeWidth="1.5"
      className="text-muted/30"
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/** Section heading with left accent border. */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-l-2 border-[#FF6B35] pl-3 text-[14px] font-semibold text-foreground">
      {children}
    </h3>
  );
}

// ---- Status badge colors ----

const STATUS_COLORS: Record<string, string> = {
  OUT: "bg-red-500/20 text-red-400",
  DAY_TO_DAY: "bg-yellow-500/20 text-yellow-400",
  QUESTIONABLE: "bg-amber-500/20 text-amber-400",
  DOUBTFUL: "bg-orange-500/20 text-orange-400",
};

const STATUS_LABELS: Record<string, string> = {
  OUT: "OUT",
  DAY_TO_DAY: "DTD",
  QUESTIONABLE: "Q",
  DOUBTFUL: "DBTL",
};

// ---- Main component ----

interface PredictionPanelProps {
  teams: ESPNTeam[];
  userTeamId: number;
  weekMatchups: ESPNScheduleEntry[];
  season: number;
}

/** AI-style weekly prediction widget for fantasy matchups. */
export default function PredictionPanel({
  teams,
  userTeamId,
  weekMatchups,
  season,
}: PredictionPanelProps) {
  const { start, end } = useMemo(() => getCurrentWeekRange(), []);

  // fetch the NBA game schedule for this week
  const scheduleQuery = useQuery({
    queryKey: queryKeys.nba.schedule(start, end),
    queryFn: async (): Promise<WeekSchedule> => {
      const res = await fetch(`/api/nba/schedule?start=${start}&end=${end}`);
      if (!res.ok) throw new Error("Failed to load schedule");
      return res.json();
    },
    staleTime: 6 * 60 * 60_000,
  });

  // fetch actual free agents from ESPN
  const freeAgentsQuery = useQuery({
    queryKey: queryKeys.nba.freeAgents(season),
    queryFn: async (): Promise<FreeAgent[]> => {
      const res = await fetch(`/api/nba/freeagents?season=${season}&limit=10`);
      if (!res.ok) throw new Error("Failed to load free agents");
      const data: {
        id: number;
        name: string;
        position: number;
        proTeamId: number;
        avgPts: number;
      }[] = await res.json();
      return data
        .filter((p) => p.avgPts > 0)
        .map((p) => ({
          id: p.id,
          name: p.name,
          team: PRO_TEAM_ABBREV[p.proTeamId] ?? "??",
          position: ESPN_POSITION_MAP[p.position] ?? "??",
          avgPts: p.avgPts,
          games: (scheduleQuery.data?.[p.proTeamId] ?? []).length,
        }));
    },
    enabled: scheduleQuery.isSuccess,
    staleTime: 60 * 60_000,
  });

  const scheduleData = scheduleQuery.data;

  const predictions = useMemo(() => {
    const sched = scheduleData ?? {};
    const userTeam = teams.find((t) => t.id === userTeamId);
    if (!userTeam?.roster?.entries || !scheduleData) return null;

    const matchup = weekMatchups.find(
      (e) => e.away.teamId === userTeamId || e.home.teamId === userTeamId,
    );
    const opponentId =
      matchup?.away.teamId === userTeamId
        ? matchup?.home.teamId
        : matchup?.away.teamId;
    const opponentTeam = teams.find((t) => t.id === opponentId);

    const startSit = buildStartSit(userTeam.roster.entries, sched);
    const outlook = buildOutlook(userTeam, opponentTeam, sched);
    const injuries = buildInjuryWatch(userTeam.roster.entries);

    return { startSit, outlook, injuries };
  }, [teams, userTeamId, weekMatchups, scheduleData]);

  const freeAgents = freeAgentsQuery.data ?? [];

  if (!predictions && !scheduleQuery.isLoading) return null;

  // loading state while schedule fetches
  if (scheduleQuery.isLoading) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
        <div className="space-y-4 animate-pulse">
          <div className="h-5 w-48 rounded bg-surface-raised" />
          <div className="h-40 w-full rounded bg-surface-raised" />
          <div className="h-5 w-36 rounded bg-surface-raised" />
          <div className="h-24 w-full rounded bg-surface-raised" />
        </div>
      </div>
    );
  }

  if (!predictions) return null;

  const { startSit, outlook, injuries } = predictions;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-8 space-y-6"
      >
        <div className="rounded-xl border border-border bg-surface p-5 space-y-6">
          {/* 1. Start/Sit Recommendations */}
          <section className="space-y-3">
            <SectionHeading>Start / Sit Recommendations</SectionHeading>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border bg-surface-raised/30">
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted/60">
                      Player
                    </th>
                    <th className="px-3 py-2 text-center font-semibold uppercase tracking-wider text-muted/60">
                      Pos
                    </th>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted/60">
                      Games This Week
                    </th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-muted/60">
                      Avg
                    </th>
                    <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-muted/60">
                      Week Proj
                    </th>
                    <th className="px-3 py-2 text-center font-semibold uppercase tracking-wider text-muted/60">
                      Confidence
                    </th>
                    <th className="px-3 py-2 text-center font-semibold uppercase tracking-wider text-muted/60">
                      Call
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {startSit.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/30 last:border-b-0"
                    >
                      <td className="px-3 py-2 font-medium text-foreground">
                        <span className="flex items-center gap-1.5">
                          {p.name}
                          {p.injuryStatus && (
                            <span
                              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                                STATUS_COLORS[p.injuryStatus] ??
                                "bg-muted/20 text-muted"
                              }`}
                            >
                              {STATUS_LABELS[p.injuryStatus] ?? p.injuryStatus}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-muted">
                        {p.position}
                      </td>
                      <td className="px-3 py-2">
                        {p.games.length === 0 ? (
                          <span className="text-[11px] text-muted/40">
                            No games
                          </span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {p.games.map((g, i) => (
                              <span
                                key={i}
                                className="text-[11px] text-muted/70"
                              >
                                {g.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-muted">
                        {p.avgPts}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground font-semibold">
                        {p.weekProjPts}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <ConfidenceBar value={p.confidence} />
                          <span className="text-[10px] text-muted/60 font-mono tabular-nums w-7 text-right">
                            {p.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            p.start
                              ? "bg-green-500/20 text-green-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {p.start ? "START" : "SIT"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Waiver Wire Suggestions (real free agents) */}
          {freeAgents.length > 0 && (
            <section className="space-y-3">
              <SectionHeading>Waiver Wire Suggestions</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {freeAgents.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {w.name}
                      </p>
                      <p className="text-[11px] text-muted">
                        {w.team} · {w.position} · {w.games}G this wk
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <div className="text-right">
                        <span className="text-[12px] font-mono tabular-nums text-foreground">
                          {w.avgPts}
                        </span>
                        <span className="block text-[9px] text-muted/50 uppercase">
                          avg/g
                        </span>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400 uppercase tracking-wide">
                        FA
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. Weekly Outlook */}
          <section className="space-y-3">
            <SectionHeading>Weekly Outlook</SectionHeading>
            <div className="rounded-lg border border-border bg-background/50 px-4 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} filled={i < outlook.stars} />
                  ))}
                </div>
                {(outlook.userProj > 0 || outlook.oppProj > 0) && (
                  <div className="flex items-center gap-2 text-[12px] font-mono tabular-nums">
                    <span className="text-[#FF6B35] font-semibold">
                      {outlook.userProj}
                    </span>
                    <span className="text-muted/40">vs</span>
                    <span className="text-[#00D4FF] font-semibold">
                      {outlook.oppProj}
                    </span>
                    <span className="text-[10px] text-muted/40 font-sans">
                      projected
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[13px] text-muted leading-relaxed">
                {outlook.summary}
              </p>
            </div>
          </section>

          {/* 4. Injury Watch */}
          {injuries.length > 0 ? (
            <section className="space-y-3">
              <SectionHeading>Injury Watch</SectionHeading>
              <div className="flex flex-wrap gap-2">
                {injuries.map((inj) => (
                  <div
                    key={inj.name}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2"
                  >
                    <span className="text-[12px] font-medium text-foreground">
                      {inj.name}
                    </span>
                    <span className="text-[10px] text-muted">
                      {inj.position}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        STATUS_COLORS[inj.status] ?? "bg-muted/20 text-muted"
                      }`}
                    >
                      {STATUS_LABELS[inj.status] ?? inj.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="space-y-3">
              <SectionHeading>Injury Watch</SectionHeading>
              <p className="text-[12px] text-muted/50 pl-4">
                No injury flags on your roster this week.
              </p>
            </section>
          )}
        </div>

        {/* Footer disclaimer */}
        <p className="text-center text-[11px] font-mono text-muted/40">
          Based on season averages and opponent rankings
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
