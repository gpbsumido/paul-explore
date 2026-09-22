"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { attributePlays, type RosterName } from "@/lib/nfl/plays";
import type { NflMatchup, NflPlayAttribution, NflScoringPlay } from "@/types/espn-nfl";

function scoringLabel(scoringType: string): string {
  return scoringType || "score";
}

/** Presentational list -- pure props in, no fetching, so it's cheap to test. */
export function PlaysTickerList({ plays }: { plays: NflPlayAttribution[] }) {
  if (plays.length === 0) {
    return (
      <p className="py-6 text-center text-[13px] text-muted">
        No scoring plays yet
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/50">
      {plays.map(({ play, mentions }) => (
        <li key={play.id} className="flex flex-wrap items-baseline gap-2 px-3 py-2 text-[12px]">
          <span className="shrink-0 font-mono tabular-nums text-muted">
            Q{play.period} {play.clock}
          </span>
          <span className="shrink-0 rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-black/60 dark:bg-white/10 dark:text-white/60">
            {scoringLabel(play.scoringType)}
          </span>
          <span className="min-w-0 flex-1 text-foreground">{play.text}</span>
          {mentions.map((m) => (
            <span
              key={m.playerName}
              className="shrink-0 rounded-full bg-[var(--color-feature-nfl)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-feature-nfl)]"
            >
              {m.fantasyTeamName}
            </span>
          ))}
        </li>
      ))}
    </ul>
  );
}

/** Every distinct proTeamId rostered as a starter across the week's matchups. */
function rosteredTeamIds(matchups: NflMatchup[]): number[] {
  const ids = new Set<number>();
  for (const m of matchups) {
    for (const p of [...m.away.starters, ...m.home.starters]) ids.add(p.proTeamId);
  }
  return [...ids].sort((a, b) => a - b);
}

/** Every starter across the week's matchups, with the fantasy team they play for. */
function rosterNames(matchups: NflMatchup[]): RosterName[] {
  const roster: RosterName[] = [];
  for (const m of matchups) {
    for (const p of m.away.starters) roster.push({ name: p.name, fantasyTeamName: m.away.name });
    for (const p of m.home.starters) roster.push({ name: p.name, fantasyTeamName: m.home.name });
  }
  return roster;
}

/** Fetches this week's live scoring plays and tags them back to a fantasy roster. */
export default function PlaysTicker({
  matchups,
  season,
  week,
}: {
  matchups: NflMatchup[];
  season: number;
  week: number;
}) {
  const teamIds = rosteredTeamIds(matchups);

  const query = useQuery({
    queryKey: queryKeys.nfl.plays(season, week, teamIds),
    enabled: teamIds.length > 0,
    queryFn: async (): Promise<{ plays: NflScoringPlay[] }> => {
      const res = await fetch(
        `/api/nfl/plays?teamIds=${teamIds.join(",")}&week=${week}&season=${season}`,
      );
      if (!res.ok) throw new Error("Failed to load scoring plays");
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const attributed = query.data ? attributePlays(query.data.plays, rosterNames(matchups)) : [];

  return (
    <section
      aria-label="Recent scoring plays"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-h-[40vh] w-full max-w-5xl overflow-y-auto border-t border-border bg-surface shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:max-h-56 sm:rounded-t-xl sm:border-x"
    >
      <h2 className="sticky top-0 border-b border-border bg-surface px-4 py-3 text-[13px] font-semibold text-foreground">
        Recent scoring plays
      </h2>
      {query.isLoading && (
        <p className="py-6 text-center text-[13px] text-muted">Loading…</p>
      )}
      {query.isError && (
        <p className="py-6 text-center text-[13px] text-muted">
          Couldn&apos;t load live scoring plays
        </p>
      )}
      {!query.isLoading && !query.isError && <PlaysTickerList plays={attributed} />}
    </section>
  );
}
