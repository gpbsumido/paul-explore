"use client";

import { useState } from "react";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui";
import type { Team, Player, PlayerStats, PlayerRow, SortKey } from "./types";
import { queryKeys } from "@/lib/queryKeys";
import { COLUMNS, getSortValue } from "@/lib/nba";
import { selectChevron } from "@/assets/icons";
import ErrorRowModal from "./ErrorRowModal";
import NoStats from "./NoStats";

export default function StatsContent() {
  // null = no explicit pick yet; once the user picks a team this holds their choice.
  const [explicitTeamId, setExplicitTeamId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("pts");
  const [sortAsc, setSortAsc] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const queryClient = useQueryClient();

  /** Full list of NBA teams, sorted alphabetically for the selector. */
  const teamsQuery = useQuery({
    queryKey: queryKeys.nba.teams(),
    queryFn: async (): Promise<Team[]> => {
      const res = await fetch("/api/nba/teams");
      if (!res.ok) throw new Error("Failed to load teams");
      const json = await res.json();
      const list: Team[] = json.data?.data ?? json.data ?? [];
      return [...list].sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
    staleTime: 5 * 60_000,
  });

  const teams = teamsQuery.data ?? [];

  // Derive active team: explicit user choice, falling back to the first team
  // once loaded. No effect needed — this is just derived state.
  const selectedTeamId = explicitTeamId ?? teamsQuery.data?.[0]?.id ?? null;

  /** Roster for the selected team. Stays disabled until a team is chosen. */
  const playersQuery = useQuery({
    queryKey: queryKeys.nba.players(selectedTeamId!),
    queryFn: async (): Promise<Player[]> => {
      const res = await fetch(`/api/nba/players/${selectedTeamId}`);
      if (!res.ok) throw new Error("Failed to load players");
      const json = await res.json();
      return json.data?.data ?? json.data ?? [];
    },
    enabled: !!selectedTeamId,
    staleTime: 5 * 60_000,
  });

  const players = playersQuery.data ?? [];

  /** One query per player, all firing in parallel. Replaces the manual batch loop. */
  const statsQueries = useQueries({
    queries: players.map((p) => ({
      queryKey: queryKeys.nba.stats(p.id),
      queryFn: async ({
        signal,
      }: {
        signal: AbortSignal;
      }): Promise<PlayerStats> => {
        const res = await fetch(`/api/nba/stats/${p.id}`, { signal });
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        const raw = json.data?.data ?? json.data;
        const stats: PlayerStats = Array.isArray(raw) ? raw[0] : raw;
        if (!stats) throw new Error("No data");
        return stats;
      },
      staleTime: 5 * 60_000,
      enabled: players.length > 0,
    })),
  });

  // Cancel all in-flight stats requests before navigating so they don't block
  // the RSC fetch for the destination page. Without this the browser connection
  // pool stays saturated and the navigation hangs until the requests drain.
  function handleDashboardNav() {
    queryClient.cancelQueries({ queryKey: ["nba", "stats"] });
  }

  /** Number of stats queries still in-flight, drives the skeleton row count. */
  const remaining = statsQueries.filter((q) => q.isPending).length;

  /**
   * Resolved player rows only. Pending players are not included here so they
   * render as skeleton rows below the resolved ones instead of blank data cells.
   */
  const rows: PlayerRow[] = players
    .map((p, i) => {
      const q = statsQueries[i];
      if (!q || q.isPending) return null;
      return {
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        pos: p.position || "—",
        stats: q.data ?? null,
        error: q.isError,
      };
    })
    .filter(Boolean) as PlayerRow[];

  /** Whether teams or players failed to load, which blocks the whole page. */
  const topLevelError = teamsQuery.isError || playersQuery.isError;
  const topLevelErrorMessage = teamsQuery.isError
    ? teamsQuery.error instanceof Error
      ? teamsQuery.error.message
      : "Failed to load teams"
    : playersQuery.error instanceof Error
      ? playersQuery.error.message
      : "Failed to load players";

  function handleTeamChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value);
    if (!id) return;
    setExplicitTeamId(id);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "name" || key === "pos");
    }
  }

  /** Sorted version of resolved rows, re-computed on every sort change. */
  const sortedRows = [...rows].sort((a, b) => {
    const aVal = getSortValue(a, sortKey);
    const bVal = getSortValue(b, sortKey);
    const cmp =
      typeof aVal === "string"
        ? aVal.localeCompare(bVal as string)
        : (aVal as number) - (bVal as number);
    return sortAsc ? cmp : -cmp;
  });

  const thBase =
    "px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted border-b border-border whitespace-nowrap cursor-pointer select-none transition-colors hover:text-foreground bg-surface";
  const tdBase =
    "px-2.5 py-2 text-foreground border-b border-border/50 whitespace-nowrap";

  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/", onClick: handleDashboardNav },
          { label: "Player Stats" },
        ]}
      />

      {/* ---- Team selector ---- */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center gap-3">
          <span className="text-[13px] text-muted shrink-0">Team</span>
          <select
            className="h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-foreground font-sans outline-none appearance-none cursor-pointer transition-colors hover:border-foreground/30 focus:border-foreground/50"
            style={{
              backgroundImage: selectChevron,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              paddingRight: "28px",
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
      </div>

      {/* ---- Content ---- */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        {topLevelError && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted text-[15px]">
            <span>{topLevelErrorMessage}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                teamsQuery.isError
                  ? teamsQuery.refetch()
                  : playersQuery.refetch()
              }
            >
              Retry
            </Button>
          </div>
        )}

        {!selectedTeamId && !teamsQuery.isLoading && !teamsQuery.isError && (
          <div className="flex items-center justify-center text-muted text-[15px] py-20 text-center">
            Pick a team to view player stats
          </div>
        )}

        {!topLevelError && (rows.length > 0 || remaining > 0) && (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
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
                    className={`${row.error ? "cursor-pointer" : ""} ${rowIdx % 2 === 1 ? "bg-surface-raised/50" : ""}`}
                    onClick={
                      row.error ? () => setErrorModalOpen(true) : undefined
                    }
                  >
                    {row.error ? (
                      <>
                        <td
                          className={`${tdBase} sticky left-0 z-[1] min-w-[130px] bg-red-500/10`}
                        >
                          <span className="font-medium">{row.name}</span>
                        </td>
                        <td
                          colSpan={COLUMNS.length - 1}
                          className={`${tdBase} bg-red-500/10`}
                        >
                          <span className="text-red-500 dark:text-red-400 text-xs italic">
                            Failed to load stats
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td
                          className={`${tdBase} sticky left-0 z-[1] min-w-[130px] ${rowIdx % 2 === 1 ? "bg-surface-raised/50" : "bg-surface"}`}
                        >
                          <span className="font-medium">{row.name}</span>
                        </td>
                        <td className={`${tdBase} text-right`}>
                          <span className="text-muted text-[11px]">
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
                          <td key={j} className={`${tdBase} text-right`}>
                            {val}
                          </td>
                        ))}
                      </>
                    )}
                  </tr>
                ))}
                {remaining > 0 &&
                  Array.from({ length: remaining }).map((_, i) => {
                    const rowIdx = sortedRows.length + i;
                    return (
                      <tr
                        key={`skel-${i}`}
                        className={
                          rowIdx % 2 === 1 ? "bg-surface-raised/50" : ""
                        }
                      >
                        <td
                          className={`${tdBase} sticky left-0 z-[1] min-w-[130px] ${rowIdx % 2 === 1 ? "bg-surface-raised/50" : "bg-surface"}`}
                        >
                          <div className="h-3.5 w-[120px] rounded bg-surface-raised animate-pulse" />
                        </td>
                        {Array.from({ length: COLUMNS.length - 1 }).map(
                          (_, j) => (
                            <td key={j} className={`${tdBase} text-right`}>
                              <div className="h-3.5 w-9 rounded bg-surface-raised animate-pulse ml-auto" />
                            </td>
                          ),
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {!topLevelError &&
          !playersQuery.isFetching &&
          selectedTeamId &&
          players.length === 0 && <NoStats />}
      </main>

      <ErrorRowModal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
      />
    </div>
  );
}
