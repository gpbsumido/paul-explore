"use client";

import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select } from "@/components/ui";
import { queryKeys } from "@/lib/queryKeys";
import {
  attributePlays,
  filterPlays,
  playFilterOptions,
  rosterStarters,
  type PlayFilters,
} from "@/lib/nfl/plays";
import {
  ESPN_NFL_POSITION,
  type NflMatchup,
  type NflPlayAttribution,
  type NflScoringPlay,
} from "@/types/espn-nfl";

/** The play the cards should highlight, or null to clear it. */
export type PlaySelection = { playId: string; playerIds: number[] } | null;

function scoringLabel(scoringType: string): string {
  return scoringType || "score";
}

/** Turns a select's "" into "no filter", everything else through `parse`. */
function optional<T>(value: string, parse: (v: string) => T): T | undefined {
  return value === "" ? undefined : parse(value);
}

const filterSelectClass = "text-[12px]";

/**
 * The ticker itself, with no fetching: header toggle, filters, and the play
 * list. Plays are buttons so a click (or Enter/Space) can pick one for the
 * matchup cards to highlight.
 */
export function PlaysTickerPanel({
  plays,
  matchups,
  status,
  selectedPlayId,
  onSelectPlay,
}: {
  plays: NflPlayAttribution[];
  matchups: NflMatchup[];
  status: "loading" | "error" | "ready";
  selectedPlayId: string | null;
  onSelectPlay: (selection: PlaySelection) => void;
}) {
  const bodyId = useId();
  const [expanded, setExpanded] = useState(true);
  const [filters, setFilters] = useState<PlayFilters>({});

  const options = playFilterOptions(plays);
  const visible = filterPlays(plays, filters);
  const filtering = Object.values(filters).some((v) => v !== undefined);
  const teams = matchups.flatMap((m) => [m.away, m.home]);

  function setFilter<K extends keyof PlayFilters>(key: K, value: PlayFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <section
      aria-label="Recent scoring plays"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-h-[45vh] w-full max-w-5xl flex-col border-t border-border bg-surface shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:max-h-72 sm:rounded-t-xl sm:border-x"
    >
      <h2 className="border-b border-border">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-[13px] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
        >
          <span>
            Recent scoring plays
            {status === "ready" && plays.length > 0 && (
              <span className="font-normal text-muted tabular-nums">
                {" "}
                ({filtering ? `${visible.length} of ${plays.length}` : plays.length})
              </span>
            )}
          </span>
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
            className={`text-muted transition-transform motion-reduce:transition-none ${expanded ? "" : "rotate-180"}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </h2>

      {expanded && (
        <div id={bodyId} className="min-h-0 overflow-y-auto">
          {status === "loading" && (
            <p className="py-6 text-center text-[13px] text-muted">Loading…</p>
          )}
          {status === "error" && (
            <p className="py-6 text-center text-[13px] text-muted">
              Couldn&apos;t load live scoring plays
            </p>
          )}
          {status === "ready" && plays.length === 0 && (
            <p className="py-6 text-center text-[13px] text-muted">
              No scoring plays yet
            </p>
          )}

          {status === "ready" && plays.length > 0 && (
            <>
              <div
                role="group"
                aria-label="Scoring play filters"
                className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/50 px-3 py-2"
              >
                <Select
                  label="Position"
                  className={filterSelectClass}
                  value={filters.positionId === undefined ? "" : String(filters.positionId)}
                  onChange={(e) => setFilter("positionId", optional(e.target.value, Number))}
                >
                  <option value="">All</option>
                  {options.positionIds.map((id) => (
                    <option key={id} value={id}>
                      {ESPN_NFL_POSITION[id] ?? `Pos ${id}`}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Score type"
                  className={filterSelectClass}
                  value={filters.scoringType ?? ""}
                  onChange={(e) => setFilter("scoringType", optional(e.target.value, String))}
                >
                  <option value="">All</option>
                  {options.scoringTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Matchup"
                  className={filterSelectClass}
                  value={filters.matchupId === undefined ? "" : String(filters.matchupId)}
                  onChange={(e) => setFilter("matchupId", optional(e.target.value, Number))}
                >
                  <option value="">All</option>
                  {matchups.map((m) => (
                    <option key={m.id} value={m.id}>
                      {`${m.away.name} vs ${m.home.name}`}
                    </option>
                  ))}
                </Select>
                <Select
                  label="NFL team"
                  className={filterSelectClass}
                  value={filters.nflTeam ?? ""}
                  onChange={(e) => setFilter("nflTeam", optional(e.target.value, String))}
                >
                  <option value="">All</option>
                  {options.nflTeams.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Fantasy team"
                  className={filterSelectClass}
                  value={filters.fantasyTeamId === undefined ? "" : String(filters.fantasyTeamId)}
                  onChange={(e) => setFilter("fantasyTeamId", optional(e.target.value, Number))}
                >
                  <option value="">All</option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.name}
                    </option>
                  ))}
                </Select>
                {filtering && (
                  <button
                    type="button"
                    onClick={() => setFilters({})}
                    className="rounded px-1.5 py-0.5 text-[12px] font-medium text-muted underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-foreground"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {visible.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted">
                  No plays match these filters
                </p>
              ) : (
                <ul className="divide-y divide-border/50">
                  {visible.map(({ play, mentions }) => {
                    const selected = play.id === selectedPlayId;
                    return (
                      <li key={play.id}>
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            onSelectPlay(
                              selected
                                ? null
                                : { playId: play.id, playerIds: mentions.map((m) => m.playerId) },
                            )
                          }
                          className={`flex w-full flex-wrap items-baseline gap-2 px-3 py-2 text-left text-[12px] transition-colors motion-reduce:transition-none hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground ${
                            selected ? "bg-[var(--color-feature-nfl)]/10 shadow-[inset_3px_0_0_var(--color-feature-nfl)]" : ""
                          }`}
                        >
                          <span className="shrink-0 font-mono tabular-nums text-muted">
                            Q{play.period} {play.clock}
                          </span>
                          <span className="shrink-0 rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-black/60 dark:bg-white/10 dark:text-white/60">
                            {scoringLabel(play.scoringType)}
                          </span>
                          <span className="min-w-0 flex-1 text-foreground">{play.text}</span>
                          {[...new Set(mentions.map((m) => m.fantasyTeamName))].map((team) => (
                            <span
                              key={team}
                              className="shrink-0 rounded-full bg-[var(--color-feature-nfl)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-feature-nfl)]"
                            >
                              {team}
                            </span>
                          ))}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </section>
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

/** Fetches this week's live scoring plays and tags them back to a fantasy roster. */
export default function PlaysTicker({
  matchups,
  season,
  week,
  selectedPlayId,
  onSelectPlay,
}: {
  matchups: NflMatchup[];
  season: number;
  week: number;
  selectedPlayId: string | null;
  onSelectPlay: (selection: PlaySelection) => void;
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

  const attributed = query.data
    ? attributePlays(query.data.plays, rosterStarters(matchups))
    : [];

  return (
    <PlaysTickerPanel
      plays={attributed}
      matchups={matchups}
      status={query.isLoading ? "loading" : query.isError ? "error" : "ready"}
      selectedPlayId={selectedPlayId}
      onSelectPlay={onSelectPlay}
    />
  );
}
