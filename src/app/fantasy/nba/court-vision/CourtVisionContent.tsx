"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui";
import { selectChevron } from "@/assets/icons";
import { queryKeys } from "@/lib/queryKeys";
import FantasyNav from "../FantasyNav";
import CourtSVG from "./CourtSVG";
import type { Team, Player } from "@/types/nba";
import type { ShotChartData } from "@/types/nba";

export default function CourtVisionContent() {
  const [explicitTeamId, setExplicitTeamId] = useState<number | null>(null);
  const [playerId, setPlayerId] = useState<number | null>(null);

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
  const selectedTeamId = explicitTeamId ?? teams[0]?.id ?? null;

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

  const shotsQuery = useQuery({
    queryKey: queryKeys.nba.shots(playerId!),
    queryFn: async (): Promise<ShotChartData> => {
      const res = await fetch(`/api/nba/shots/${playerId}`);
      if (!res.ok) throw new Error("Failed to load shot data");
      const json = await res.json();
      return json.data;
    },
    enabled: !!playerId,
    staleTime: 60 * 60_000,
  });

  const selectedPlayer = players.find((p) => p.id === playerId);

  function handleTeamChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value);
    if (!id) return;
    setExplicitTeamId(id);
    setPlayerId(null);
  }

  function handlePlayerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value);
    setPlayerId(id || null);
  }

  const topLevelError = teamsQuery.isError || playersQuery.isError;

  const selectClass =
    "h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-foreground font-sans outline-none appearance-none cursor-pointer transition-colors hover:border-foreground/30 focus:border-foreground/50";
  const selectStyle = {
    backgroundImage: selectChevron,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center",
    paddingRight: "28px",
  };

  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Court Vision" },
        ]}
      />
      <FantasyNav />

      {/* Team + player selector */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          <span className="text-[13px] text-muted shrink-0">Team</span>
          <select
            className={selectClass}
            style={selectStyle}
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

          <span className="text-[13px] text-muted shrink-0">Player</span>
          <select
            className={selectClass}
            style={selectStyle}
            value={playerId ?? ""}
            onChange={handlePlayerChange}
            disabled={!selectedTeamId || players.length === 0}
          >
            <option value="">Select a player…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {topLevelError && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted text-[15px]">
            <span>
              {teamsQuery.isError
                ? "Failed to load teams"
                : "Failed to load players"}
            </span>
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

        {!topLevelError && !playerId && (
          <div className="flex flex-col items-center gap-6">
            <CourtSVG zones={[]} />
            <p className="text-[13px] text-muted/50">
              Select a team and player to view their shot chart
            </p>
          </div>
        )}

        {!topLevelError && playerId && shotsQuery.isLoading && (
          <div className="flex flex-col items-center gap-6">
            <CourtSVG zones={[]} loading />
            <p className="text-[13px] text-muted/50 animate-pulse">
              Loading shot data…
            </p>
          </div>
        )}

        {!topLevelError && playerId && shotsQuery.isError && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted text-[15px]">
            <span>Failed to load shot data</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shotsQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {!topLevelError &&
          playerId &&
          shotsQuery.data &&
          !shotsQuery.isError && (
            <div className="flex flex-col items-center gap-6">
              {selectedPlayer && (
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedPlayer.first_name} {selectedPlayer.last_name}
                </h2>
              )}
              <CourtSVG zones={shotsQuery.data.zones} />

              {/* Zone stats table */}
              <div className="w-full max-w-lg overflow-hidden rounded-lg border border-border">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-raised/30">
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted/60">
                        Zone
                      </th>
                      <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-muted/60">
                        FG%
                      </th>
                      <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-muted/60">
                        FGM
                      </th>
                      <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-muted/60">
                        FGA
                      </th>
                      <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-muted/60">
                        Att/G
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shotsQuery.data.zones.map((zone) => (
                      <tr
                        key={zone.zone}
                        className="border-b border-border/30 last:border-b-0"
                      >
                        <td className="px-3 py-2 font-medium text-foreground capitalize">
                          {zone.zone.replace(/-/g, " ")}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono tabular-nums font-semibold ${
                            zone.fgPct >= 0.48
                              ? "text-red-400"
                              : zone.fgPct >= 0.35
                                ? "text-yellow-400"
                                : "text-blue-400"
                          }`}
                        >
                          {(zone.fgPct * 100).toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-muted">
                          {zone.fgm}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-muted">
                          {zone.fga}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-muted">
                          {zone.attPerGame}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
