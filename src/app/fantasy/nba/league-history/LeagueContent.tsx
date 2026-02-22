"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui";
import { selectChevron } from "@/assets/icons";
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
  if (rank === 0) {
    return null;
  }
  let colors = "bg-black/10 text-white/80 dark:bg-white/10 dark:text-white/70";
  if (rank === 1)
    colors =
      "bg-green-500/25 text-green-100 dark:bg-green-400/20 dark:text-green-200";
  else if (rank <= 3)
    colors =
      "bg-blue-500/25 text-blue-100 dark:bg-blue-400/20 dark:text-blue-200";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors}`}
    >
      #{rank}
    </span>
  );
}

function TeamCard({
  team,
  members,
}: {
  team: ESPNTeam;
  members: ESPNMember[];
}) {
  const [expanded, setExpanded] = useState(false);
  const { wins, losses } = team.record.overall;

  return (
    <div className="rounded-xl border border-black/10 bg-white/25 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:shadow-xl overflow-hidden transition-shadow hover:shadow-xl dark:hover:shadow-2xl">
      <button
        type="button"
        className="w-full text-left px-4 py-3 cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-white dark:text-white truncate">
              {team.name}
            </p>
            <p className="text-[12px] text-white/70 dark:text-white/60 truncate">
              {getOwnerName(team, members)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[13px] font-medium text-white dark:text-white">
              {wins}-{losses}
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
            className={`text-white/50 dark:text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {expanded && team.roster?.entries?.length > 0 && (
        <div className="border-t border-black/10 dark:border-white/10 px-4 py-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/70 dark:text-white/60 text-xs uppercase tracking-wider">
                <th className="text-left py-1 font-medium">Player</th>
                <th className="text-right py-1 font-medium">Pos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {team.roster.entries.map((entry) => {
                const player = entry.playerPoolEntry.player;
                return (
                  <tr key={player.id}>
                    <td className="py-1.5 text-white dark:text-white font-medium">
                      {player.fullName}
                    </td>
                    <td className="py-1.5 text-right text-white/70 dark:text-white/60">
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
  const [teams, setTeams] = useState<ESPNTeam[]>([]);
  const [members, setMembers] = useState<ESPNMember[]>([]);
  const [leagueName, setLeagueName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeague = useCallback(async (yr: number) => {
    setLoading(true);
    setError(null);
    setTeams([]);
    setMembers([]);

    try {
      const res = await fetch(`/api/nba/league/${yr}`);
      if (!res.ok) throw new Error("Failed to load league data");
      const data: ESPNLeagueResponse = await res.json();

      setLeagueName(data.settings.name);
      setMembers(data.members ?? []);

      const sorted = [...data.teams].sort(
        (a, b) => a.rankCalculatedFinal - b.rankCalculatedFinal,
      );
      setTeams(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeague(season);
  }, [season, fetchLeague]);

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSeason(Number(e.target.value));
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-[480px] mx-auto font-sans bg-background">
      {/* ---- Top bar ---- */}
      <div className="sticky top-0 z-20 flex items-center justify-center px-4 py-3 bg-background border-b border-border backdrop-blur-xl">
        <Link
          href="/protected"
          className="absolute left-4 text-[#007aff] text-sm flex items-center gap-0.5"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path
              d="M9 1L2 8l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          &nbsp;Back
        </Link>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-base font-semibold text-foreground">
            League History
          </span>
          <span className="text-[11px] text-muted">Fantasy</span>
        </div>
        <div className="absolute right-4">
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Season selector ---- */}
      <div className="px-4 py-3 border-b border-border">
        <select
          className="w-full h-10 rounded-[10px] border border-border bg-surface-raised px-3 text-[15px] text-foreground font-sans outline-none appearance-none cursor-pointer transition-colors focus:border-[#007aff]"
          style={{
            backgroundImage: selectChevron,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
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

      {/* ---- Content ---- */}
      <div className="flex-1 flex flex-col">
        {loading && (
          <div className="flex-1 flex items-center justify-center text-muted text-[15px] px-4 py-10">
            Loading league data…
          </div>
        )}

        {error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 py-10 text-center text-muted text-[15px]">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLeague(season)}
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && teams.length > 0 && (
          <div className="flex-1 bg-gradient-to-br from-secondary-600 to-primary-700 dark:from-secondary-900 dark:to-primary-950 px-4 py-4 flex flex-col gap-3">
            {leagueName && (
              <p className="text-[13px] text-white/80 dark:text-white/70 text-center">
                {leagueName}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} members={members} />
              ))}
            </div>
          </div>
        )}

        {!loading && !error && teams.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted text-[15px] px-4 py-10 text-center">
            No league data available
          </div>
        )}
      </div>
    </div>
  );
}
