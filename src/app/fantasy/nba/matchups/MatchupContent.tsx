"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui";
import { selectChevron } from "@/assets/icons";
import { queryKeys } from "@/lib/queryKeys";
import FantasyNav from "../FantasyNav";
import PredictionPanel from "./PredictionPanel";
import type {
  ESPNScoreboardResponse,
  ESPNScheduleEntry,
  ESPNMember,
  ESPNTeam,
} from "@/types/espn";

// ---- Constants ----

const FIRST_YEAR = 2025;
const CURRENT_YEAR = new Date().getFullYear();

function getSeasons(): number[] {
  const seasons: number[] = [];
  for (let yr = CURRENT_YEAR; yr >= FIRST_YEAR; yr--) seasons.push(yr);
  return seasons;
}

const SEASONS = getSeasons();

/** ESPN stat IDs mapped to display labels for the category breakdown. */
const STAT_CATEGORIES: { id: string; label: string }[] = [
  { id: "0", label: "PTS" },
  { id: "6", label: "REB" },
  { id: "3", label: "AST" },
  { id: "2", label: "STL" },
  { id: "1", label: "BLK" },
  { id: "17", label: "3PM" },
  { id: "11", label: "TO" },
];

/** Turnovers are inverted: lower is better. */
const LOWER_IS_BETTER = new Set(["11"]);

// ---- Helpers ----

function getOwnerName(team: ESPNTeam, members: ESPNMember[]): string {
  if (!team.owners?.length) return "Unknown";
  const member = members.find((m) => m.id === team.owners[0]);
  if (!member) return "Unknown";
  return member.firstName && member.lastName
    ? `${member.firstName} ${member.lastName}`
    : member.displayName;
}

function getStatScore(side: ESPNScheduleEntry["away"], statId: string): number {
  return side.cumulativeScore.scoreByStat?.[statId]?.score ?? 0;
}

// ---- Animated win probability bar ----

function WinBar({ leftPct, animate }: { leftPct: number; animate: boolean }) {
  const spring = useSpring(animate ? 0 : leftPct, {
    stiffness: 90,
    damping: 18,
  });
  const leftWidth = useTransform(spring, (v) => `${v}%`);
  const rightWidth = useTransform(spring, (v) => `${100 - v}%`);

  useEffect(() => {
    if (animate) spring.set(leftPct);
  }, [animate, leftPct, spring]);

  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/5">
      <motion.div
        className="rounded-l-full bg-[#FF6B35]"
        style={{ width: leftWidth }}
      />
      <motion.div
        className="rounded-r-full bg-[#00D4FF]"
        style={{ width: rightWidth }}
      />
    </div>
  );
}

// ---- Category row ----

function CategoryRow({
  label,
  awayVal,
  homeVal,
  lowerIsBetter,
}: {
  label: string;
  awayVal: number;
  homeVal: number;
  lowerIsBetter: boolean;
}) {
  const awayWins = lowerIsBetter ? awayVal < homeVal : awayVal > homeVal;
  const homeWins = lowerIsBetter ? homeVal < awayVal : homeVal > awayVal;
  const tied = awayVal === homeVal;

  return (
    <tr className="border-b border-border/50 last:border-b-0">
      <td
        className={`px-3 py-2 text-right text-[13px] font-mono tabular-nums ${
          awayWins && !tied ? "font-bold text-[#FF6B35]" : "text-muted"
        }`}
      >
        {Number.isInteger(awayVal) ? awayVal : awayVal.toFixed(1)}
      </td>
      <td className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted/60">
        {label}
      </td>
      <td
        className={`px-3 py-2 text-left text-[13px] font-mono tabular-nums ${
          homeWins && !tied ? "font-bold text-[#00D4FF]" : "text-muted"
        }`}
      >
        {Number.isInteger(homeVal) ? homeVal : homeVal.toFixed(1)}
      </td>
    </tr>
  );
}

// ---- Matchup card ----

function MatchupCard({
  entry,
  teams,
  members,
}: {
  entry: ESPNScheduleEntry;
  teams: ESPNTeam[];
  members: ESPNMember[];
}) {
  const awayTeam = teams.find((t) => t.id === entry.away.teamId);
  const homeTeam = teams.find((t) => t.id === entry.home.teamId);
  const awayPts = entry.away.totalPoints;
  const homePts = entry.home.totalPoints;
  const total = awayPts + homePts;
  const leftPct = total > 0 ? (awayPts / total) * 100 : 50;

  // Count category wins for each side
  let awayCatWins = 0;
  let homeCatWins = 0;
  for (const { id } of STAT_CATEGORIES) {
    const a = getStatScore(entry.away, id);
    const h = getStatScore(entry.home, id);
    const lower = LOWER_IS_BETTER.has(id);
    if (lower ? a < h : a > h) awayCatWins++;
    else if (lower ? h < a : h > a) homeCatWins++;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {/* Team names + scores */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4">
        {/* Away */}
        <div className="min-w-0 text-left">
          <p className="truncate text-[14px] font-semibold text-foreground">
            {awayTeam?.name ?? `Team ${entry.away.teamId}`}
          </p>
          <p className="truncate text-[11px] text-muted">
            {awayTeam ? getOwnerName(awayTeam, members) : ""}
          </p>
        </div>

        {/* VS + score */}
        <div className="flex flex-col items-center gap-0.5 px-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono tabular-nums text-[#FF6B35]">
              {awayPts.toFixed(0)}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/40">
              vs
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#00D4FF]">
              {homePts.toFixed(0)}
            </span>
          </div>
          <span className="text-[10px] font-medium text-muted/50 tabular-nums">
            {awayCatWins}–{STAT_CATEGORIES.length - awayCatWins - homeCatWins}–
            {homeCatWins}
          </span>
        </div>

        {/* Home */}
        <div className="min-w-0 text-right">
          <p className="truncate text-[14px] font-semibold text-foreground">
            {homeTeam?.name ?? `Team ${entry.home.teamId}`}
          </p>
          <p className="truncate text-[11px] text-muted">
            {homeTeam ? getOwnerName(homeTeam, members) : ""}
          </p>
        </div>
      </div>

      {/* Win probability bar */}
      <div className="px-4 pb-3">
        <WinBar leftPct={leftPct} animate />
      </div>

      {/* Category breakdown */}
      <div className="border-t border-border">
        <table className="w-full">
          <tbody>
            {STAT_CATEGORIES.map(({ id, label }) => (
              <CategoryRow
                key={id}
                label={label}
                awayVal={getStatScore(entry.away, id)}
                homeVal={getStatScore(entry.home, id)}
                lowerIsBetter={LOWER_IS_BETTER.has(id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Skeleton card ----

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-surface-raised animate-pulse" />
          <div className="h-3 w-20 rounded bg-surface-raised animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-1 px-2">
          <div className="h-5 w-24 rounded bg-surface-raised animate-pulse" />
          <div className="h-3 w-10 rounded bg-surface-raised animate-pulse" />
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="h-4 w-32 rounded bg-surface-raised animate-pulse" />
          <div className="h-3 w-20 rounded bg-surface-raised animate-pulse" />
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="h-2.5 w-full rounded-full bg-surface-raised animate-pulse" />
      </div>
      <div className="border-t border-border p-3 space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-4 w-full rounded bg-surface-raised animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

// ---- Main content ----

export default function MatchupContent() {
  const [season, setSeason] = useState(CURRENT_YEAR);
  const [week, setWeek] = useState<number | null>(null);
  const [myTeamId, setMyTeamId] = useState<number | null>(null);

  const scoreboardQuery = useQuery({
    queryKey: queryKeys.nba.scoreboard(season),
    queryFn: async (): Promise<ESPNScoreboardResponse> => {
      const res = await fetch(`/api/nba/scoreboard/${season}`);
      if (!res.ok) throw new Error("Failed to load scoreboard");
      return res.json();
    },
    staleTime: 60 * 60_000,
  });

  const data = scoreboardQuery.data;
  const teamsCount = data?.teams?.length ?? 8;
  const matchupsPerWeek = Math.max(1, Math.floor(teamsCount / 2));
  const regularSeasonWeeks =
    data?.settings?.scheduleSettings?.matchupPeriodCount ?? 22;
  // Total weeks includes playoffs — derive from schedule length
  const totalWeeks = data
    ? Math.floor(data.schedule.length / matchupsPerWeek)
    : 24;
  const currentWeek = data?.status?.currentMatchupPeriod ?? totalWeeks;

  // Derive the displayed week: user's explicit pick, or the current week from the API
  const activeWeek = week ?? Math.min(currentWeek, totalWeeks);
  const playoffRound =
    activeWeek > regularSeasonWeeks ? activeWeek - regularSeasonWeeks : 0;

  // Slice the flat schedule array into the active week's matchups
  const weekMatchups: ESPNScheduleEntry[] = data
    ? data.schedule.slice(
        (activeWeek - 1) * matchupsPerWeek,
        activeWeek * matchupsPerWeek,
      )
    : [];

  // Detect weeks where ESPN hasn't processed any scores yet
  const allZero =
    weekMatchups.length > 0 &&
    weekMatchups.every(
      (e) => e.away.totalPoints === 0 && e.home.totalPoints === 0,
    );

  const teams = data?.teams ?? [];
  const members = data?.members ?? [];

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSeason(Number(e.target.value));
    setWeek(null);
  }

  function handleWeekChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setWeek(Number(e.target.value));
  }

  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Matchups" }]}
      />
      <FantasyNav />

      {/* Season + week selector */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          <span className="text-[13px] text-muted shrink-0">Season</span>
          <select
            className="h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-foreground font-sans outline-none appearance-none cursor-pointer transition-colors hover:border-foreground/30 focus:border-foreground/50"
            style={{
              backgroundImage: selectChevron,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              paddingRight: "28px",
            }}
            value={season}
            onChange={handleSeasonChange}
          >
            {SEASONS.map((yr) => (
              <option key={yr} value={yr}>
                {yr - 1}–{yr}
              </option>
            ))}
          </select>

          <span className="text-[13px] text-muted shrink-0">Week</span>
          <select
            className="h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-foreground font-sans outline-none appearance-none cursor-pointer transition-colors hover:border-foreground/30 focus:border-foreground/50"
            style={{
              backgroundImage: selectChevron,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              paddingRight: "28px",
            }}
            value={activeWeek}
            onChange={handleWeekChange}
            disabled={!data}
          >
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => {
              const isPlayoff = w > regularSeasonWeeks;
              const round = w - regularSeasonWeeks;
              return (
                <option key={w} value={w}>
                  {isPlayoff ? `Playoffs R${round} (Wk ${w})` : `Week ${w}`}
                </option>
              );
            })}
          </select>

          {/* Prediction for picker for predictions */}
          <span className="text-[13px] text-muted shrink-0 ml-auto sm:ml-0">
            Prediction for
          </span>
          <select
            className="h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-foreground font-sans outline-none appearance-none cursor-pointer transition-colors hover:border-foreground/30 focus:border-foreground/50"
            style={{
              backgroundImage: selectChevron,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              paddingRight: "28px",
            }}
            value={myTeamId ?? ""}
            onChange={(e) => setMyTeamId(Number(e.target.value) || null)}
            disabled={teams.length === 0}
          >
            <option value="">Select…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Week navigation arrows */}
          <div className="flex items-center gap-1 sm:ml-auto">
            <button
              type="button"
              aria-label="Previous week"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
              disabled={activeWeek <= 1}
              onClick={() => setWeek(activeWeek - 1)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next week"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
              disabled={activeWeek >= totalWeeks}
              onClick={() => setWeek(activeWeek + 1)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        {scoreboardQuery.isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {scoreboardQuery.isError && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted text-[15px]">
            <span>
              {scoreboardQuery.error instanceof Error
                ? scoreboardQuery.error.message
                : "Something went wrong"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scoreboardQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {!scoreboardQuery.isLoading &&
          !scoreboardQuery.isError &&
          weekMatchups.length > 0 && (
            <>
              {(playoffRound > 0 || allZero) && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {playoffRound > 0 && (
                    <span className="inline-flex items-center rounded-full bg-orange-500/15 px-3 py-1 text-[12px] font-semibold text-orange-400">
                      Playoff Round {playoffRound}
                    </span>
                  )}
                  {allZero && (
                    <span className="text-[12px] text-muted/60 italic">
                      Scores update as games complete
                    </span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {weekMatchups.map((entry) => (
                  <MatchupCard
                    key={entry.id}
                    entry={entry}
                    teams={teams}
                    members={members}
                  />
                ))}
              </div>
            </>
          )}

        {!scoreboardQuery.isLoading &&
          !scoreboardQuery.isError &&
          weekMatchups.length === 0 && (
            <div className="flex items-center justify-center text-muted text-[15px] py-20 text-center">
              No matchups for this week
            </div>
          )}

        {/* Prediction panel, shown when a team is selected */}
        {!scoreboardQuery.isLoading &&
          !scoreboardQuery.isError &&
          myTeamId &&
          weekMatchups.length > 0 && (
            <PredictionPanel
              teams={teams}
              userTeamId={myTeamId}
              weekMatchups={weekMatchups}
              season={season}
            />
          )}
      </main>
    </div>
  );
}
