"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui";
import type {
  Team,
  Player,
  PlayerStats,
  SortKey,
  PlayerRow,
} from "@/types/nba";
import { COLUMNS, getSortValue } from "@/lib/nba";
import { selectChevron } from "@/assets/icons";
import ErrorRowModal from "./ErrorRowModal";
import NoStats from "./NoStats";

export default function StatsContent() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("pts");
  const [sortAsc, setSortAsc] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  // fetch teams
  useEffect(() => {
    fetch("/api/nba/teams")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load teams");
        return res.json();
      })
      .then((json) => {
        const list: Team[] = json.data?.data ?? json.data ?? [];
        const sorted = [...list].sort((a, b) =>
          a.full_name.localeCompare(b.full_name),
        );
        setTeams(sorted);
      })
      .catch((err) => setError(err.message));
  }, []);

  // fetch team stats
  const fetchTeamStats = useCallback(async (teamId: number) => {
    setLoading(true);
    setError(null);
    setRows([]);
    setRemaining(0);

    try {
      const playersRes = await fetch(`/api/nba/players/${teamId}`);
      if (!playersRes.ok) throw new Error("Failed to load players");
      const playersJson = await playersRes.json();
      const players: Player[] =
        playersJson.data?.data ?? playersJson.data ?? [];

      setRemaining(players.length);

      const BATCH_SIZE = 3;

      for (let i = 0; i < players.length; i += BATCH_SIZE) {
        const batch = players.slice(i, i + BATCH_SIZE);
        const statsResults = await Promise.allSettled(
          batch.map(async (player) => {
            const res = await fetch(`/api/nba/stats/${player.id}`);
            if (!res.ok) throw new Error("Failed");
            const statsJson = await res.json();
            const raw = statsJson.data?.data ?? statsJson.data;
            const stats: PlayerStats = Array.isArray(raw) ? raw[0] : raw;
            if (!stats) throw new Error("No data");
            return {
              id: player.id,
              name: `${player.first_name} ${player.last_name}`,
              pos: player.position || "—",
              stats,
            } as PlayerRow;
          }),
        );

        const batchRows: PlayerRow[] = statsResults.map((result, idx) => {
          if (result.status === "fulfilled") return result.value;
          const player = batch[idx];
          return {
            id: player.id,
            name: `${player.first_name} ${player.last_name}`,
            pos: player.position || "—",
            stats: null,
            error: true,
          };
        });

        setRows((prev) => [...prev, ...batchRows]);
        setRemaining((prev) => Math.max(0, prev - batch.length));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  // handle team change
  function handleTeamChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value);
    if (!id) return;
    setSelectedTeamId(id);
    fetchTeamStats(id);
  }

  // handle sort
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "name" || key === "pos");
    }
  }

  // populate sorted rows
  const sortedRows = [...rows].sort((a, b) => {
    const aVal = getSortValue(a, sortKey);
    const bVal = getSortValue(b, sortKey);
    const cmp =
      typeof aVal === "string"
        ? aVal.localeCompare(bVal as string)
        : (aVal as number) - (bVal as number);
    return sortAsc ? cmp : -cmp;
  });

  // base styles for table cells and headers
  const thBase =
    "px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/70 dark:text-white/60 border-b border-black/10 dark:border-white/10 whitespace-nowrap cursor-pointer select-none transition-colors hover:text-white";
  const tdBase =
    "px-2.5 py-2 text-white dark:text-white border-b border-black/5 dark:border-white/5 whitespace-nowrap";

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
            Player Stats
          </span>
          <span className="text-[11px] text-muted">Fantasy</span>
        </div>
        <div className="absolute right-4">
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Team selector ---- */}
      <div className="px-4 py-3 border-b border-border">
        <select
          className="w-full h-10 rounded-[10px] border border-border bg-surface-raised px-3 text-[15px] text-foreground font-sans outline-none appearance-none cursor-pointer transition-colors focus:border-[#007aff]"
          style={{
            backgroundImage: selectChevron,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
          }}
          value={selectedTeamId ?? ""}
          onChange={handleTeamChange}
        >
          <option value="">Select a team…</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* ---- Content ---- */}
      <div className="flex-1 flex flex-col">
        {error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 py-10 text-center text-muted text-[15px]">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedTeamId && fetchTeamStats(selectedTeamId)}
            >
              Retry
            </Button>
          </div>
        )}

        {!error && !selectedTeamId && !loading && (
          <div className="flex-1 flex items-center justify-center text-muted text-[15px] px-4 py-10 text-center">
            Pick a team to view player stats
          </div>
        )}

        {!error && (rows.length > 0 || remaining > 0) && (
          <div className="flex-1 bg-gradient-to-br from-secondary-600 to-primary-700 dark:from-secondary-900 dark:to-primary-950">
            <div className="overflow-x-auto rounded-xl m-3 border border-black/10 bg-white/25 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:shadow-xl">
              <table className="w-full min-w-[480px] border-collapse text-[13px]">
                <thead className="sticky top-0 z-[1]">
                  <tr>
                    {COLUMNS.map((col, i) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`${thBase} ${i === 0 ? "sticky left-0 z-[2] min-w-[130px] text-left" : "text-right"}`}
                      >
                        {col.label}
                        {sortKey === col.key && (
                          <span className="inline-block ml-0.5 text-[10px] opacity-60">
                            {sortAsc ? "▲" : "▼"}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, rowIdx) => (
                    <tr
                      key={row.id}
                      className={`${row.error ? "cursor-pointer" : ""} ${rowIdx % 2 === 1 ? "bg-white/10 dark:bg-white/5" : ""}`}
                      onClick={
                        row.error ? () => setErrorModalOpen(true) : undefined
                      }
                    >
                      {row.error ? (
                        <>
                          <td
                            className={`${tdBase} sticky left-0 z-[1] min-w-[130px] bg-red-500/20 dark:bg-red-400/10`}
                          >
                            <span className="font-medium">{row.name}</span>
                          </td>
                          <td
                            colSpan={COLUMNS.length - 1}
                            className={`${tdBase} bg-red-500/20 dark:bg-red-400/10`}
                          >
                            <span className="text-red-200 dark:text-red-300 text-xs italic">
                              Failed to load stats
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            className={`${tdBase} sticky left-0 z-[1] min-w-[130px] ${rowIdx % 2 === 1 ? "bg-white/10 dark:bg-white/5" : ""}`}
                          >
                            <span className="font-medium">{row.name}</span>
                          </td>
                          <td
                            className={`${tdBase} text-right`}
                          >
                            <span className="text-white/60 dark:text-white/50 text-[11px] ml-1">
                              {row.pos}
                            </span>
                          </td>
                          {[
                            row.stats!.games_played,
                            row.stats!.pts?.toFixed(1),
                            row.stats!.reb?.toFixed(1),
                            row.stats!.ast?.toFixed(1),
                            row.stats!.stl?.toFixed(1),
                            row.stats!.blk?.toFixed(1),
                          ].map((val, j) => (
                            <td
                              key={j}
                              className={`${tdBase} text-right`}
                            >
                              {val}
                            </td>
                          ))}
                        </>
                      )}
                    </tr>
                  ))}
                  {remaining > 0 &&
                    Array.from({ length: remaining }).map((_, i) => {
                      const rowIdx = rows.length + i;
                      return (
                        <tr
                          key={`skel-${i}`}
                          className={rowIdx % 2 === 1 ? "bg-white/10 dark:bg-white/5" : ""}
                        >
                          <td
                            className={`${tdBase} sticky left-0 z-[1] min-w-[130px] ${rowIdx % 2 === 1 ? "bg-white/10 dark:bg-white/5" : ""}`}
                          >
                            <div className="h-3.5 w-[120px] rounded bg-white/20 dark:bg-white/10 animate-pulse" />
                          </td>
                          {Array.from({ length: COLUMNS.length - 1 }).map(
                            (_, j) => (
                              <td
                                key={j}
                                className={`${tdBase} text-right`}
                              >
                                <div className="h-3.5 w-9 rounded bg-white/20 dark:bg-white/10 animate-pulse ml-auto" />
                              </td>
                            ),
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!error && !loading && selectedTeamId && rows.length === 0 && (
          <NoStats />
        )}
      </div>

      <ErrorRowModal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
      />
    </div>
  );
}
