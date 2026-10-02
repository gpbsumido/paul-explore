"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Button, FilterBar, Input, Select } from "@/components/ui";
import { queryKeys } from "@/lib/queryKeys";
import {
  evaluateTrade,
  type SideChange,
  type TradeHorizon,
  type TradePlayer,
  type TradePool,
} from "@/lib/nfl/trade";
import { ESPN_NFL_POSITION, NFL_PRO_TEAM_ABBREV } from "@/types/espn-nfl";
import FantasyNflNav from "../FantasyNflNav";

const CURRENT_YEAR = new Date().getFullYear();

/** Positions in lineup order, so a roster reads QB, RB, WR, TE, K, D/ST. */
const POSITION_ORDER = [1, 2, 3, 4, 5, 16];

function fmt(n: number): string {
  return n.toFixed(1);
}

function signed(n: number): string {
  return n > 0 ? `+${fmt(n)}` : fmt(n);
}

/** SOS in words, so the number isn't the only signal. 32 teams: thirds. */
function sosLabel(rank: number | null): string {
  if (rank === null) return "SOS n/a";
  const rounded = Math.round(rank);
  const word = rounded >= 21 ? "easy" : rounded <= 12 ? "hard" : "neutral";
  return `SOS ${rounded} · ${word}`;
}

function weeksLabel([first, last]: [number, number]): string {
  if (last < first) return "no weeks left";
  return first === last ? `wk ${first}` : `wks ${first}–${last}`;
}

function bySlotThenValue(a: TradePlayer, b: TradePlayer): number {
  const pos = POSITION_ORDER.indexOf(a.positionId) - POSITION_ORDER.indexOf(b.positionId);
  return pos !== 0 ? pos : b.perGame - a.perGame;
}

// ---- Roster picker ----

function RosterPicker({
  legend,
  players,
  selected,
  onToggle,
}: {
  legend: string;
  players: TradePlayer[];
  selected: ReadonlySet<number>;
  onToggle: (playerId: number) => void;
}) {
  return (
    <fieldset className="min-w-0 rounded-xl border border-border bg-surface">
      <legend className="ml-3 px-1 text-[13px] font-semibold text-foreground">{legend}</legend>
      <ul className="divide-y divide-border/50">
        {[...players].sort(bySlotThenValue).map((p) => {
          const checked = selected.has(p.playerId);
          const id = `trade-player-${p.playerId}`;
          return (
            <li
              key={p.playerId}
              className={`flex items-center gap-3 px-3 py-2 text-[12px] ${checked ? "shadow-[inset_3px_0_0_var(--color-feature-nfl)]" : ""}`}
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(p.playerId)}
                className="h-4 w-4 shrink-0 accent-[var(--color-feature-nfl)]"
              />
              <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                <span className="block truncate font-medium text-foreground" title={p.name}>
                  {p.name}
                </span>
                <span className="block text-[11px] text-muted">
                  {ESPN_NFL_POSITION[p.positionId] ?? "-"} · {NFL_PRO_TEAM_ABBREV[p.proTeamId] ?? "FA"}
                  {p.injuryStatus !== "ACTIVE" && (
                    <span className="ml-1 font-semibold text-foreground">
                      · {p.injuryStatus.replace(/_/g, " ").toLowerCase()}
                    </span>
                  )}
                </span>
              </label>
              <span className="shrink-0 text-right font-mono text-[11px] tabular-nums text-muted">
                <span className="block text-foreground">{fmt(p.thisWeek)} this wk</span>
                <span className="block">
                  {fmt(p.perGame)}/g · {sosLabel(p.sosRank)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

// ---- Verdict ----

function changeCell(change: SideChange) {
  return (
    <td className="px-3 py-2 text-right font-mono tabular-nums">
      <span className="font-semibold text-foreground">{signed(change.delta)}</span>
      <span className="block text-[10px] text-muted">
        {fmt(change.before)} → {fmt(change.after)}
      </span>
    </td>
  );
}

const HORIZON_PHRASE: Record<TradeHorizon["key"], string> = {
  thisWeek: "this week",
  nextWeek: "next week",
  restOfSeason: "over the rest of the season",
};

function verdictText(h: TradeHorizon, aName: string, bName: string): string {
  const span = `${HORIZON_PHRASE[h.key]} (${weeksLabel(h.weeks)})`;
  if (h.winner === "even") {
    return `Too close to call ${span}: ${aName} ${signed(h.a.delta)}, ${bName} ${signed(h.b.delta)}.`;
  }
  const [winner, loser] = h.winner === "A" ? [aName, bName] : [bName, aName];
  const [won, lost] = h.winner === "A" ? [h.a.delta, h.b.delta] : [h.b.delta, h.a.delta];
  return `${winner} wins this trade ${span}: ${signed(won)} for them, ${signed(lost)} for ${loser}, a ${fmt(Math.abs(h.margin))}-point swing.`;
}

// ---- Analyzer ----

/** The trade builder and verdict, given a parsed pool. Pure props in, no fetching. */
export function TradeAnalyzer({ pool }: { pool: TradePool }) {
  const [teamA, setTeamA] = useState<number | null>(pool.teams[0]?.teamId ?? null);
  const [teamB, setTeamB] = useState<number | null>(null);
  const [fromA, setFromA] = useState<ReadonlySet<number>>(new Set());
  const [fromB, setFromB] = useState<ReadonlySet<number>>(new Set());
  const [search, setSearch] = useState("");

  const teamName = (id: number | null) => pool.teams.find((t) => t.teamId === id)?.name ?? "";
  const rosterOf = (id: number | null) => pool.players.filter((p) => p.fantasyTeamId === id);

  function toggle(set: ReadonlySet<number>, id: number): ReadonlySet<number> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  function chooseA(id: number | null) {
    setTeamA(id);
    setFromA(new Set());
  }

  function chooseB(id: number | null) {
    setTeamB(id);
    setFromB(new Set());
  }

  /** A searched player joins team A's side if they're on A, else B becomes their team. */
  function addFromSearch(p: TradePlayer) {
    if (p.fantasyTeamId === teamA) {
      setFromA((s) => new Set(s).add(p.playerId));
    } else {
      if (p.fantasyTeamId !== teamB) setTeamB(p.fantasyTeamId);
      setFromB((s) => new Set(p.fantasyTeamId === teamB ? s : []).add(p.playerId));
    }
    setSearch("");
  }

  const term = search.trim().toLowerCase();
  const inTrade = new Set([...fromA, ...fromB]);
  const matches =
    term.length < 2
      ? []
      : pool.players
          .filter((p) => !inTrade.has(p.playerId) && p.name.toLowerCase().includes(term))
          .slice(0, 8);

  const ready = teamA !== null && teamB !== null && fromA.size > 0 && fromB.size > 0;
  const result = ready
    ? evaluateTrade(pool, { teamA, teamB, fromA: [...fromA], fromB: [...fromB] })
    : null;
  const ros = result?.horizons.find((h) => h.key === "restOfSeason");
  const headline =
    result && ros && ros.weeks[1] >= ros.weeks[0] ? ros : result?.horizons[0];

  return (
    <div className="space-y-6">
      <FilterBar label="Trade teams">
        <Select
          label="Team A"
          value={teamA ?? ""}
          onChange={(e) => chooseA(e.target.value === "" ? null : Number(e.target.value))}
        >
          <option value="">Choose a team</option>
          {pool.teams
            .filter((t) => t.teamId !== teamB)
            .map((t) => (
              <option key={t.teamId} value={t.teamId}>
                {t.name}
              </option>
            ))}
        </Select>
        <Select
          label="Team B"
          value={teamB ?? ""}
          onChange={(e) => chooseB(e.target.value === "" ? null : Number(e.target.value))}
        >
          <option value="">Choose a team</option>
          {pool.teams
            .filter((t) => t.teamId !== teamA)
            .map((t) => (
              <option key={t.teamId} value={t.teamId}>
                {t.name}
              </option>
            ))}
        </Select>
      </FilterBar>

      <div className="relative max-w-md">
        <Input
          type="search"
          label="Search players"
          size="sm"
          placeholder="Search any rostered player"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {matches.length > 0 && (
          <ul
            aria-label="Matching players"
            className="mt-1 divide-y divide-border/50 overflow-hidden rounded-lg border border-border bg-surface"
          >
            {matches.map((p) => (
              <li key={p.playerId}>
                <button
                  type="button"
                  onClick={() => addFromSearch(p)}
                  aria-label={`Add ${p.name}, ${ESPN_NFL_POSITION[p.positionId] ?? "-"}, ${teamName(p.fantasyTeamId)}`}
                  className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-[12px] hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
                >
                  <span className="font-medium text-foreground">{p.name}</span>
                  <span className="text-muted">
                    {ESPN_NFL_POSITION[p.positionId] ?? "-"} · {teamName(p.fantasyTeamId)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {term.length >= 2 && matches.length === 0 && (
          <p className="mt-1 text-[12px] text-muted">No rostered players match.</p>
        )}
      </div>

      <section aria-label="Trade verdict" className="rounded-xl border border-border bg-surface p-4">
        <p role="status" className="text-[14px] font-semibold text-foreground">
          {result && headline
            ? verdictText(headline, teamName(teamA), teamName(teamB))
            : "Add players to both sides to see who wins."}
        </p>

        {result && (
          <>
            <div className="mt-3 overflow-x-auto">
              <table aria-label="Trade projection" className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted">
                    <th scope="col" className="px-3 py-2 text-left font-semibold">Horizon</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{teamName(teamA)}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{teamName(teamB)}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Edge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {result.horizons.map((h) => (
                    <tr key={h.key}>
                      <th scope="row" className="px-3 py-2 text-left font-medium text-foreground">
                        {h.label}
                        <span className="block text-[10px] font-normal text-muted">
                          {weeksLabel(h.weeks)}
                        </span>
                      </th>
                      {changeCell(h.a)}
                      {changeCell(h.b)}
                      <td className="px-3 py-2 text-right font-semibold text-foreground">
                        {h.winner === "even"
                          ? "Even"
                          : `${teamName(h.winner === "A" ? teamA : teamB)} by ${fmt(Math.abs(h.margin))}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12px] text-muted">
              Rest-of-season SOS of what each side gets: {teamName(teamA)}{" "}
              {sosLabel(result.sos.aReceives)}, {teamName(teamB)} {sosLabel(result.sos.bReceives)}.
              Ranks run 1 (toughest defenses for the position) to 32 (softest).
            </p>
          </>
        )}

        <p className="mt-3 text-[11px] text-muted">
          Each number is the change in a team&apos;s best possible starting lineup,
          week by week, with byes counted. Future weeks spread ESPN&apos;s
          rest-of-season projection over each player&apos;s remaining games. It
          doesn&apos;t count a waiver pickup for a roster spot a trade opens.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {teamA !== null ? (
          <RosterPicker
            legend={teamName(teamA)}
            players={rosterOf(teamA)}
            selected={fromA}
            onToggle={(id) => setFromA((s) => toggle(s, id))}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-[13px] text-muted">
            Choose team A
          </p>
        )}
        {teamB !== null ? (
          <RosterPicker
            legend={teamName(teamB)}
            players={rosterOf(teamB)}
            selected={fromB}
            onToggle={(id) => setFromB((s) => toggle(s, id))}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-[13px] text-muted">
            Choose team B, or search for a player to trade for
          </p>
        )}
      </div>
    </div>
  );
}

// ---- Page ----

function SkeletonAnalyzer() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="flex gap-3">
        <div className="h-9 w-48 rounded-lg bg-surface-raised animate-pulse" />
        <div className="h-9 w-48 rounded-lg bg-surface-raised animate-pulse" />
      </div>
      <div className="h-8 w-full max-w-md rounded-lg bg-surface-raised animate-pulse" />
      <div className="h-24 w-full rounded-xl bg-surface-raised animate-pulse" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border p-3">
            {Array.from({ length: 8 }).map((__, j) => (
              <div key={j} className="h-8 w-full rounded bg-surface-raised animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Fetches the league's rostered player pool and hosts the analyzer. */
export default function TradeContent() {
  const season = CURRENT_YEAR;
  const query = useQuery({
    queryKey: queryKeys.nfl.trade(season),
    queryFn: async (): Promise<TradePool> => {
      const res = await fetch(`/api/nfl/trade/${season}`);
      if (!res.ok) throw new Error("Failed to load the league");
      return res.json();
    },
    staleTime: 60 * 60_000,
  });

  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Fantasy NFL", href: "/fantasy/nfl" },
          { label: "Trade analyzer" },
        ]}
      />
      <FantasyNflNav />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6" aria-busy={query.isLoading}>
        <h1 className="mb-1 text-xl font-bold tracking-tight text-foreground">Trade analyzer</h1>
        <p className="mb-6 text-[13px] text-muted">
          Pick two teams, choose who moves, and see who comes out ahead this week,
          next week, and for the rest of the season.
        </p>

        {query.isLoading && <SkeletonAnalyzer />}

        {query.isError && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted text-[15px]">
            <span>{query.error instanceof Error ? query.error.message : "Something went wrong"}</span>
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {query.data && query.data.players.length === 0 && (
          <p className="py-20 text-center text-[15px] text-muted">
            No rostered players for this season yet
          </p>
        )}

        {query.data && query.data.players.length > 0 && <TradeAnalyzer pool={query.data} />}
      </main>
    </div>
  );
}
