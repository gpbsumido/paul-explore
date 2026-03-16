"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui";
import { selectChevron } from "@/assets/icons";
import { queryKeys } from "@/lib/queryKeys";
import type { ESPNLeagueResponse, ESPNTeam, ESPNMember } from "@/types/espn";

const POSITION_MAP: Record<number, string> = {
  1: "PG",
  2: "SG",
  3: "SF",
  4: "PF",
  5: "C",
};

const FIRST_YEAR = 2025;
const CURRENT_YEAR = new Date().getFullYear();

function getSeasons(): number[] {
  const seasons: number[] = [];
  for (let yr = CURRENT_YEAR; yr >= FIRST_YEAR; yr--) {
    seasons.push(yr);
  }
  return seasons;
}

const SEASONS = getSeasons();

function getOwnerName(team: ESPNTeam, members: ESPNMember[]): string {
  if (!team.owners?.length) return "Unknown";
  const member = members.find((m) => m.id === team.owners[0]);
  return member?.displayName ?? "Unknown";
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 0) return null;
  let colors = "bg-surface-raised text-muted";
  if (rank === 1) colors = "bg-green-500/15 text-green-600 dark:text-green-400";
  else if (rank <= 3) colors = "bg-blue-500/15 text-blue-600 dark:text-blue-400";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors}`}>
      #{rank}
    </span>
  );
}

function TeamCard({ team, members }: { team: ESPNTeam; members: ESPNMember[] }) {
  const [expanded, setExpanded] = useState(false);
  const { wins, losses } = team.record.overall;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden transition-shadow hover:shadow-md">
      <button
        type="button"
        className="w-full text-left px-4 py-3 cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground truncate">
              {team.name}
            </p>
            <p className="text-[12px] text-muted truncate">
              {getOwnerName(team, members)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[13px] font-medium text-foreground tabular-nums">
              {wins}–{losses}
            </span>
            <RankBadge rank={team.rankCalculatedFinal} />
          </div>
        </div>
        <div className="flex items-center justify-end mt-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={`text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {expanded && team.roster?.entries?.length > 0 && (
        <div className="border-t border-border px-4 py-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted text-xs uppercase tracking-wider">
                <th className="text-left py-1 font-medium">Player</th>
                <th className="text-right py-1 font-medium">Pos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {team.roster.entries.map((entry) => {
                const player = entry.playerPoolEntry.player;
                return (
                  <tr key={player.id}>
                    <td className="py-1.5 text-foreground font-medium">
                      {player.fullName}
                    </td>
                    <td className="py-1.5 text-right text-muted">
                      {POSITION_MAP[player.defaultPositionId] ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function LeagueContent() {
  const [season, setSeason] = useState(CURRENT_YEAR);

  const leagueQuery = useQuery({
    queryKey: queryKeys.nba.league(season),
    queryFn: async (): Promise<{
      leagueName: string;
      teams: ESPNTeam[];
      members: ESPNMember[];
    }> => {
      const res = await fetch(`/api/nba/league/${season}`);
      if (!res.ok) throw new Error("Failed to load league data");
      const data: ESPNLeagueResponse = await res.json();
      const sorted = [...data.teams].sort(
        (a, b) => a.rankCalculatedFinal - b.rankCalculatedFinal,
      );
      return {
        leagueName: data.settings.name,
        teams: sorted,
        members: data.members ?? [],
      };
    },
    staleTime: 60 * 60_000,
  });

  const { leagueName = "", teams = [], members = [] } = leagueQuery.data ?? {};

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSeason(Number(e.target.value));
  }

  return (
    <div className="min-h-dvh bg-background font-sans">
      {/* ---- Nav ---- */}
      <nav
        className="sticky top-0 z-20 h-14 border-b border-border"
        style={{
          background: "color-mix(in srgb, var(--color-background) 80%, transparent)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="mx-auto flex h-full max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden>
              <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Dashboard
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground">
            League History
          </span>
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            <a
              href="/auth/logout"
              className="text-[13px] font-medium text-muted transition-colors hover:text-foreground"
            >
              Log out
            </a>
          </div>
        </div>
      </nav>

      {/* ---- Season selector ---- */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center gap-3">
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
                {yr - 1}–{yr} Season
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---- Content ---- */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        {leagueQuery.isLoading && (
          <div className="flex items-center justify-center text-muted text-[15px] py-20">
            Loading league data…
          </div>
        )}

        {leagueQuery.isError && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted text-[15px]">
            <span>
              {leagueQuery.error instanceof Error
                ? leagueQuery.error.message
                : "Something went wrong"}
            </span>
            <Button variant="outline" size="sm" onClick={() => leagueQuery.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!leagueQuery.isLoading && !leagueQuery.isError && teams.length > 0 && (
          <>
            {leagueName && (
              <p className="text-[13px] text-muted mb-4">{leagueName}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} members={members} />
              ))}
            </div>
          </>
        )}

        {!leagueQuery.isLoading && !leagueQuery.isError && teams.length === 0 && (
          <div className="flex items-center justify-center text-muted text-[15px] py-20 text-center">
            No league data available
          </div>
        )}
      </main>
    </div>
  );
}
