"use client";

import { useEffect, useState } from "react";
import { m, useSpring, useTransform } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Button, FilterBar, Select } from "@/components/ui";
import { queryKeys } from "@/lib/queryKeys";
import { useCountUp } from "@/hooks/useCountUp";
import { parseNflScoreboard } from "@/lib/nfl/matchups";
import { winProbability, type WinProbability } from "@/lib/nfl/winProbability";
import {
  ESPN_NFL_SLOT,
  ESPN_NFL_POSITION,
  type NflMatchup,
  type NflMatchupSide,
  type NflPlayerLine,
} from "@/types/espn-nfl";
import FantasyNflNav from "../FantasyNflNav";
import PlaysTicker from "./PlaysTicker";

// ---- Constants ----

const FIRST_YEAR = 2025;
const CURRENT_YEAR = new Date().getFullYear();

const SEASONS = (() => {
  const out: number[] = [];
  for (let yr = CURRENT_YEAR; yr >= FIRST_YEAR; yr--) out.push(yr);
  return out;
})();

/** A player's lineup label: the slot, falling back to the roster position. */
function slotLabel(line: NflPlayerLine): string {
  return (
    ESPN_NFL_SLOT[line.lineupSlotId] ??
    ESPN_NFL_POSITION[line.positionId] ??
    "-"
  );
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// ---- Animated score countup ----

function CountUpScore({ value, className }: { value: number; className?: string }) {
  const displayed = useCountUp(value);
  return <span className={className}>{fmt(displayed)}</span>;
}

// ---- Animated win probability bar ----

function WinBar({ awayPct }: { awayPct: number }) {
  const spring = useSpring(0, { stiffness: 90, damping: 18 });
  const leftWidth = useTransform(spring, (v) => `${v}%`);
  const rightWidth = useTransform(spring, (v) => `${100 - v}%`);

  useEffect(() => {
    spring.set(awayPct);
  }, [awayPct, spring]);

  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
      <m.div
        className="rounded-l-full bg-[var(--color-feature-flags)]"
        style={{ width: leftWidth }}
      />
      <m.div
        className="rounded-r-full bg-[var(--color-feature-nfl)]"
        style={{ width: rightWidth }}
      />
    </div>
  );
}

// ---- Roster breakdown ----

function StarterRow({ line, align }: { line: NflPlayerLine; align: "left" | "right" }) {
  const scored = line.actual > 0 || line.projected === 0;
  return (
    <div
      className={`flex items-baseline gap-2 px-3 py-1.5 text-[12px] ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <span className="w-9 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {slotLabel(line)}
      </span>
      <span className="min-w-0 flex-1 truncate text-foreground">{line.name}</span>
      <span className="font-mono tabular-nums font-semibold text-foreground">
        {fmt(line.actual)}
      </span>
      <span
        className={`font-mono tabular-nums text-[11px] ${
          scored ? "text-muted/60" : "text-muted"
        }`}
      >
        proj {fmt(line.projected)}
      </span>
    </div>
  );
}

function StarterList({ side, align }: { side: NflMatchupSide; align: "left" | "right" }) {
  return (
    <div className="divide-y divide-border/50">
      {side.starters.map((line) => (
        <StarterRow key={line.playerId} line={line} align={align} />
      ))}
    </div>
  );
}

// ---- Matchup card ----

export function NflMatchupCard({
  matchup,
  winProb,
}: {
  matchup: NflMatchup;
  winProb: WinProbability;
}) {
  const { away, home } = matchup;
  const awayPct = Math.round(winProb.away * 100);
  const homePct = 100 - awayPct;
  const awayProjFinal = away.totalPoints + away.remaining;
  const homeProjFinal = home.totalPoints + home.remaining;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {/* Team names + scores */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4">
        <div className="min-w-0 text-left">
          <p className="truncate text-[14px] font-semibold text-foreground">
            {away.name}
          </p>
          <p className="truncate text-[11px] text-muted">{away.ownerName}</p>
        </div>

        <div className="flex flex-col items-center gap-0.5 px-2">
          <div className="flex items-baseline gap-2">
            <CountUpScore
              value={away.totalPoints}
              className="text-lg font-bold font-mono tabular-nums text-[var(--color-feature-flags)]"
            />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              vs
            </span>
            <CountUpScore
              value={home.totalPoints}
              className="text-lg font-bold font-mono tabular-nums text-[var(--color-feature-nfl)]"
            />
          </div>
          <span className="text-[10px] font-medium text-muted tabular-nums">
            proj {fmt(awayProjFinal)}–{fmt(homeProjFinal)}
          </span>
        </div>

        <div className="min-w-0 text-right">
          <p className="truncate text-[14px] font-semibold text-foreground">
            {home.name}
          </p>
          <p className="truncate text-[11px] text-muted">{home.ownerName}</p>
        </div>
      </div>

      {/* Win probability */}
      <div className="px-4 pb-3">
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold tabular-nums">
          <span className="text-[var(--color-feature-flags)]">{awayPct}%</span>
          <span className="text-[10px] uppercase tracking-wider text-muted">
            win probability
          </span>
          <span className="text-[var(--color-feature-nfl)]">{homePct}%</span>
        </div>
        <WinBar awayPct={awayPct} />
      </div>

      {/* Starter breakdown */}
      <div className="grid grid-cols-2 gap-px border-t border-border bg-border">
        <div className="bg-surface">
          <StarterList side={away} align="left" />
        </div>
        <div className="bg-surface">
          <StarterList side={home} align="right" />
        </div>
      </div>
    </div>
  );
}

// ---- Skeleton ----

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
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-surface-raised animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ---- Main content ----

export default function MatchupContent() {
  // null week means "current period" — the endpoint defaults to it, and the
  // payload tells us which week that is, so no date guess is needed.
  const [season, setSeason] = useState(CURRENT_YEAR);
  const [week, setWeek] = useState<number | null>(null);

  const query = useQuery({
    queryKey: queryKeys.nfl.scoreboard(season, week ?? 0),
    queryFn: async () => {
      const url = week
        ? `/api/nfl/scoreboard/${season}?week=${week}`
        : `/api/nfl/scoreboard/${season}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load scoreboard");
      return parseNflScoreboard(await res.json(), { season, week });
    },
    staleTime: 60 * 60_000,
  });

  const board = query.data;
  const displayedWeek = week ?? board?.currentWeek ?? 1;

  const totalWeeks = board && board.totalWeeks > 0 ? board.totalWeeks : 18;
  const regularSeasonWeeks = board?.regularSeasonWeeks ?? 0;
  const playoffRound =
    regularSeasonWeeks > 0 && displayedWeek > regularSeasonWeeks
      ? displayedWeek - regularSeasonWeeks
      : 0;

  const matchups = board?.matchups ?? [];
  const allZero =
    matchups.length > 0 &&
    matchups.every((mch) => mch.away.totalPoints === 0 && mch.home.totalPoints === 0);

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSeason(Number(e.target.value));
    setWeek(null);
  }

  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "NFL Matchups" },
        ]}
      />
      <FantasyNflNav />

      <FilterBar label="Matchup filters">
        <Select label="Season" value={season} onChange={handleSeasonChange}>
          {SEASONS.map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </Select>

        <Select
          label="Week"
          value={displayedWeek}
          onChange={(e) => setWeek(Number(e.target.value))}
          disabled={!board}
        >
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => {
            const isPlayoff = regularSeasonWeeks > 0 && w > regularSeasonWeeks;
            const round = w - regularSeasonWeeks;
            return (
              <option key={w} value={w}>
                {isPlayoff ? `Playoffs R${round} (Wk ${w})` : `Week ${w}`}
              </option>
            );
          })}
        </Select>

        <div className="flex items-center gap-1 sm:ml-auto">
          <button
            type="button"
            aria-label="Previous week"
            className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
            disabled={displayedWeek <= 1}
            onClick={() => setWeek(displayedWeek - 1)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next week"
            className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
            disabled={displayedWeek >= totalWeeks}
            onClick={() => setWeek(displayedWeek + 1)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </FilterBar>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6" aria-live="polite">
        <h1 className="sr-only">NFL Fantasy Matchups</h1>

        {query.isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {query.isError && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted text-[15px]">
            <span>
              {query.error instanceof Error ? query.error.message : "Something went wrong"}
            </span>
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!query.isLoading && !query.isError && matchups.length > 0 && (
          <>
            {(playoffRound > 0 || allZero) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {playoffRound > 0 && (
                  <span className="inline-flex items-center rounded-full bg-secondary-500/15 px-3 py-1 text-[12px] font-semibold text-secondary-800 dark:text-secondary-400">
                    Playoff Round {playoffRound}
                  </span>
                )}
                {allZero && (
                  <span className="text-[12px] text-muted italic">
                    Scores update as games are played
                  </span>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {matchups.map((mch) => (
                <NflMatchupCard
                  key={mch.id}
                  matchup={mch}
                  winProb={winProbability({
                    awayActual: mch.away.totalPoints,
                    awayRemaining: mch.away.remaining,
                    homeActual: mch.home.totalPoints,
                    homeRemaining: mch.home.remaining,
                  })}
                />
              ))}
            </div>
          </>
        )}

        {!query.isLoading && !query.isError && matchups.length === 0 && (
          <div className="flex items-center justify-center text-muted text-[15px] py-20 text-center">
            No matchups for this week
          </div>
        )}

        {!query.isLoading && !query.isError && matchups.length > 0 && (
          <PlaysTicker matchups={matchups} season={season} week={displayedWeek} />
        )}
      </main>
    </div>
  );
}
