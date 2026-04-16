"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { queryKeys } from "@/lib/queryKeys";
import { useDebounce } from "@/hooks/useDebounce";
import type {
  PlayoffBracket,
  PlayoffBracketPicks,
  PlayoffMatchup,
  PlayoffSeriesPick,
  PlayoffTeam,
  FinalsPick,
} from "@/types/nba";
import FantasyNav from "../FantasyNav";
import SeriesPickCard from "./SeriesPickCard";
import FinalsCard from "./FinalsCard";
import PlayoffLeaderboard from "./PlayoffLeaderboard";

// ---- TBD resolution ----

// Maps each TBD slot (matchupId_top / matchupId_bottom) to the preceding matchup
// whose pick winner fills that slot.
export const PRECEDING: Record<string, string> = {
  E_R2_M1_top: "E_R1_M1",
  E_R2_M1_bottom: "E_R1_M2",
  E_R2_M2_top: "E_R1_M3",
  E_R2_M2_bottom: "E_R1_M4",
  E_CF_top: "E_R2_M1",
  E_CF_bottom: "E_R2_M2",
  W_R2_M1_top: "W_R1_M1",
  W_R2_M1_bottom: "W_R1_M2",
  W_R2_M2_top: "W_R1_M3",
  W_R2_M2_bottom: "W_R1_M4",
  W_CF_top: "W_R2_M1",
  W_CF_bottom: "W_R2_M2",
  NBA_FINALS_top: "E_CF",
  NBA_FINALS_bottom: "W_CF",
};

// Inverted PRECEDING: given a matchup ID, which downstream matchup IDs list it
// as a feeder? Computed once at module load from PRECEDING.
const DOWNSTREAM: Record<string, string[]> = Object.entries(PRECEDING).reduce<
  Record<string, string[]>
>((acc, [slot, precedingId]) => {
  const matchupId = slot.replace(/_(?:top|bottom)$/, "");
  return { ...acc, [precedingId]: [...(acc[precedingId] ?? []), matchupId] };
}, {});

/**
 * Builds a partial picks update that clears the `winner` field on every
 * downstream matchup whose current winner was `removedWinner`. Cascades
 * recursively so the full advancement chain is cleaned up in one pass.
 *
 * Exported for unit testing.
 */
export function buildCascadeClears(
  changedMatchupId: string,
  removedWinner: string,
  picks: PlayoffBracketPicks,
): PlayoffBracketPicks {
  const clears: PlayoffBracketPicks = {};

  function walk(matchupId: string): void {
    for (const downstreamId of DOWNSTREAM[matchupId] ?? []) {
      if (picks[downstreamId]?.winner === removedWinner) {
        clears[downstreamId] = { ...picks[downstreamId]!, winner: "" };
        walk(downstreamId);
      }
    }
  }

  walk(changedMatchupId);
  return clears;
}

const TBD_FALLBACK: PlayoffTeam = {
  seed: 0,
  teamId: "",
  abbreviation: "?",
  name: "TBD",
  conference: "East",
};

/** Resolves a TBD team slot from existing picks and bracket teams. */
function resolveTeam(
  matchupId: string,
  position: "top" | "bottom",
  team: PlayoffTeam,
  allMatchups: PlayoffMatchup[],
  picks: PlayoffBracketPicks,
): PlayoffTeam {
  if (team.abbreviation !== "TBD") return team;

  const precedingId = PRECEDING[`${matchupId}_${position}`];
  if (!precedingId) return { ...TBD_FALLBACK, conference: team.conference };

  const pick = picks[precedingId];
  if (!pick?.winner) return { ...TBD_FALLBACK, conference: team.conference };

  // Try to find the actual team object from the bracket (covers R1 teams in later rounds)
  for (const m of allMatchups) {
    if (m.topTeam.abbreviation === pick.winner) return m.topTeam;
    if (m.bottomTeam.abbreviation === pick.winner) return m.bottomTeam;
  }

  return {
    seed: 0,
    teamId: "",
    abbreviation: pick.winner,
    name: pick.winner,
    conference: team.conference,
  };
}

/** Returns a copy of the matchup with TBD teams resolved from picks. */
function resolveMatchup(
  matchup: PlayoffMatchup,
  allMatchups: PlayoffMatchup[],
  picks: PlayoffBracketPicks,
): PlayoffMatchup {
  return {
    ...matchup,
    topTeam: resolveTeam(
      matchup.id,
      "top",
      matchup.topTeam,
      allMatchups,
      picks,
    ),
    bottomTeam: resolveTeam(
      matchup.id,
      "bottom",
      matchup.bottomTeam,
      allMatchups,
      picks,
    ),
  };
}

// ---- Skeleton ----

function SkeletonRoundCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="h-3 w-20 rounded bg-surface-raised animate-pulse" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-10 w-full rounded-lg bg-surface-raised animate-pulse"
        />
      ))}
    </div>
  );
}

function BracketSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_180px_1fr] lg:items-start">
      {/* East */}
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-surface-raised animate-pulse" />
        <div className="flex gap-2 overflow-x-auto pb-2 lg:overflow-visible lg:pb-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="min-w-[130px] flex-1">
              <SkeletonRoundCard />
            </div>
          ))}
        </div>
      </div>

      {/* Finals */}
      <div className="space-y-2 lg:space-y-2">
        <div className="h-4 w-20 rounded bg-surface-raised animate-pulse" />
        <SkeletonRoundCard />
      </div>

      {/* West */}
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-surface-raised animate-pulse" />
        <div className="flex gap-2 overflow-x-auto pb-2 lg:overflow-visible lg:pb-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="min-w-[130px] flex-1">
              <SkeletonRoundCard />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Save indicator ----

type SaveStatus = "idle" | "saving" | "saved";

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  return (
    <span
      className={[
        "text-[12px] font-medium transition-opacity",
        status === "saving" ? "text-muted animate-pulse" : "text-green-400",
      ].join(" ")}
    >
      {status === "saving" ? "Saving…" : "Saved"}
    </span>
  );
}

// ---- Submit button ----

type SubmitStatus = "idle" | "submitting" | "submitted";

function SubmitButton({
  status,
  onClick,
  disabled = false,
}: {
  status: SubmitStatus;
  onClick: () => void;
  disabled?: boolean;
}) {
  const isDisabled = disabled || status === "submitting";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={[
        "rounded-lg px-4 py-1.5 text-[12px] font-semibold transition-colors",
        status === "submitted"
          ? "bg-green-500/20 text-green-400 cursor-default"
          : isDisabled
            ? "bg-orange-500/10 text-orange-400/40 cursor-not-allowed"
            : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30",
      ].join(" ")}
    >
      {status === "submitting"
        ? "Submitting…"
        : status === "submitted"
          ? "Submitted!"
          : "Submit Bracket"}
    </button>
  );
}

// ---- Round column ----

function RoundColumn({
  label,
  matchups,
  allMatchups,
  picks,
  onPick,
}: {
  label?: string;
  matchups: PlayoffMatchup[];
  allMatchups: PlayoffMatchup[];
  picks: PlayoffBracketPicks;
  onPick: (matchupId: string, pick: PlayoffSeriesPick | FinalsPick) => void;
}) {
  return (
    <div className="flex min-w-[130px] flex-1 flex-col gap-2">
      {label && (
        <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted/60">
          {label}
        </span>
      )}
      <div className="flex flex-1 flex-col gap-2">
        {matchups.map((m) => {
          const resolved = resolveMatchup(m, allMatchups, picks);
          const bothTbd =
            resolved.topTeam.abbreviation === "?" &&
            resolved.bottomTeam.abbreviation === "?";
          return (
            <SeriesPickCard
              key={m.id}
              matchupId={m.id}
              topTeam={resolved.topTeam}
              bottomTeam={resolved.bottomTeam}
              pick={picks[m.id] as PlayoffSeriesPick | undefined}
              onPick={onPick}
              disabled={bothTbd}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---- Champion display ----

function ChampionDisplay({
  picks,
  bracket,
}: {
  picks: PlayoffBracketPicks;
  bracket: PlayoffBracket;
}) {
  const finalsPick = picks["NBA_FINALS"];
  if (!finalsPick?.winner) return null;

  const champion = bracket.matchups
    .flatMap((m) => [m.topTeam, m.bottomTeam])
    .find((t) => t.abbreviation === finalsPick.winner);

  return (
    <div className="mt-3 flex flex-col items-center gap-1">
      <svg
        className="h-5 w-5 text-yellow-400"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" />
      </svg>
      <span className="text-[13px] font-semibold text-yellow-400">
        {champion?.name ?? finalsPick.winner}
      </span>
      <span className="text-[10px] text-muted/60 uppercase tracking-wide">
        Champion
      </span>
    </div>
  );
}

// ---- Main content ----

export default function PlayoffBracketContent() {
  // userEdits holds only what the user has changed this session.
  // picks is the merged result of server data + local edits — no effect needed.
  const [userEdits, setUserEdits] = useState<PlayoffBracketPicks>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [autoSave, setAutoSave] = useState(false);
  const userHasPickedRef = useRef(false);

  const meQuery = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<{ sub: string | null }> =>
      fetch("/api/me").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const currentUserSub = meQuery.data?.sub ?? null;

  const bracketQuery = useQuery({
    queryKey: queryKeys.nba.playoffBracket(),
    queryFn: async (): Promise<PlayoffBracket> => {
      const res = await fetch("/api/nba/playoffs/bracket");
      if (!res.ok) throw new Error("Failed to load bracket");
      return res.json();
    },
    staleTime: 60 * 60_000,
  });

  const picksQuery = useQuery({
    queryKey: queryKeys.nba.playoffPicks(),
    queryFn: async (): Promise<{ picks: PlayoffBracketPicks }> => {
      const res = await fetch("/api/nba/playoffs/picks");
      if (!res.ok) throw new Error("Failed to load picks");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  // Stable reference: undefined when query hasn't resolved yet, otherwise the
  // same object TanStack Query cached — safe to use as a useMemo dependency.
  const serverPicks = picksQuery.data?.picks;

  const picks = useMemo(
    () => ({ ...(serverPicks ?? {}), ...userEdits }),
    [serverPicks, userEdits],
  );

  const debouncedPicks = useDebounce(picks, 1000);

  // Debounced auto-save — only fires when auto-save is enabled and after a user interaction
  useEffect(() => {
    if (!autoSave || !userHasPickedRef.current) return;

    fetch("/api/nba/playoffs/picks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ picks: debouncedPicks }),
    })
      .then((res) => {
        if (res.ok) {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        }
      })
      .catch(() => setSaveStatus("idle"));
  }, [autoSave, debouncedPicks]);

  function handlePick(matchupId: string, pick: PlayoffSeriesPick | FinalsPick) {
    userHasPickedRef.current = true;
    if (autoSave) setSaveStatus("saving");
    setUserEdits((prevEdits) => {
      const merged = { ...(serverPicks ?? {}), ...prevEdits };
      const oldWinner = merged[matchupId]?.winner;
      const newEdits = { ...prevEdits, [matchupId]: pick };

      // When the winner changes, cascade-clear any downstream picks that had
      // advanced the now-invalid team further through the bracket.
      if (oldWinner && oldWinner !== pick.winner) {
        return {
          ...newEdits,
          ...buildCascadeClears(matchupId, oldWinner, merged),
        };
      }

      return newEdits;
    });
  }

  async function handleSubmit() {
    setSubmitStatus("submitting");
    try {
      const res = await fetch("/api/nba/playoffs/picks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks }),
      });
      if (res.ok) {
        setSubmitStatus("submitted");
        setSaveStatus("idle");
      } else {
        setSubmitStatus("idle");
      }
    } catch {
      setSubmitStatus("idle");
    }
  }

  const bracket = bracketQuery.data;
  const matchups = bracket?.matchups ?? [];

  const eastR1 = matchups.filter(
    (m) => m.conference === "East" && m.round === 1,
  );
  const eastR2 = matchups.filter(
    (m) => m.conference === "East" && m.round === 2,
  );
  const eastCF = matchups.filter(
    (m) => m.conference === "East" && m.round === 3,
  );
  const westR1 = matchups.filter(
    (m) => m.conference === "West" && m.round === 1,
  );
  const westR2 = matchups.filter(
    (m) => m.conference === "West" && m.round === 2,
  );
  const westCF = matchups.filter(
    (m) => m.conference === "West" && m.round === 3,
  );
  const finals = matchups.find((m) => m.conference === "Finals");

  const columnProps = { allMatchups: matchups, picks, onPick: handlePick };

  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Playoffs" }]}
      />
      <FantasyNav />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* Toolbar: auto-save toggle + save indicator + submit */}
        <div className="mb-4 flex items-center justify-end gap-3 min-h-8">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="h-3.5 w-3.5 accent-orange-400"
            />
            <span className="text-[12px] text-muted">Auto-save</span>
          </label>
          <SaveIndicator status={saveStatus} />
          <SubmitButton
            status={submitStatus}
            onClick={handleSubmit}
            disabled={autoSave}
          />
        </div>

        {bracketQuery.isLoading && <BracketSkeleton />}

        {bracketQuery.isError && (
          <div className="flex items-center justify-center py-20 text-muted text-[15px]">
            {bracketQuery.error instanceof Error
              ? bracketQuery.error.message
              : "Something went wrong"}
          </div>
        )}

        {bracket && (
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_180px_1fr] lg:items-start lg:gap-4">
            {/* ── East ── */}
            <div>
              <h2 className="mb-3 text-center text-[12px] font-semibold uppercase tracking-widest text-muted/60">
                Eastern Conference
              </h2>
              {/* Horizontal scroll on mobile; plain flex on desktop */}
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
                <RoundColumn label="R1" matchups={eastR1} {...columnProps} />
                <RoundColumn label="R2" matchups={eastR2} {...columnProps} />
                <RoundColumn label="ECF" matchups={eastCF} {...columnProps} />
              </div>
            </div>

            {/* ── Finals ── */}
            <div className="mx-auto w-full max-w-[260px] lg:mx-0 lg:max-w-none">
              <h2 className="mb-3 text-center text-[12px] font-semibold uppercase tracking-widest text-muted/60">
                NBA Finals
              </h2>
              {finals &&
                (() => {
                  const resolvedFinals = resolveMatchup(
                    finals,
                    matchups,
                    picks,
                  );
                  const bothTbd =
                    resolvedFinals.topTeam.abbreviation === "?" &&
                    resolvedFinals.bottomTeam.abbreviation === "?";
                  return (
                    <div className="flex flex-col items-stretch gap-2">
                      <FinalsCard
                        matchupId={finals.id}
                        topTeam={resolvedFinals.topTeam}
                        bottomTeam={resolvedFinals.bottomTeam}
                        pick={picks[finals.id] as FinalsPick | undefined}
                        onPick={handlePick}
                        disabled={bothTbd}
                      />
                      <ChampionDisplay picks={picks} bracket={bracket} />
                    </div>
                  );
                })()}
            </div>

            {/* ── West ── */}
            <div>
              <h2 className="mb-3 text-center text-[12px] font-semibold uppercase tracking-widest text-muted/60">
                Western Conference
              </h2>
              {/* Mobile: normal L→R order (R1, R2, WCF). Desktop: mirrored so WCF is closest to center. */}
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-row-reverse lg:overflow-visible lg:px-0 lg:pb-0">
                <RoundColumn label="R1" matchups={westR1} {...columnProps} />
                <RoundColumn label="R2" matchups={westR2} {...columnProps} />
                <RoundColumn label="WCF" matchups={westCF} {...columnProps} />
              </div>
            </div>
          </div>
        )}

        {/* ── Leaderboard ── */}
        <section className="mt-10">
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-widest text-muted/60">
            Leaderboard
          </h2>
          <PlayoffLeaderboard currentUserSub={currentUserSub} />
        </section>

        {/* ── Rules & Scoring ── */}
        <section className="mt-10 mb-6">
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-widest text-muted/60">
            Rules &amp; Scoring
          </h2>
          <div className="rounded-xl border border-border bg-surface p-5 space-y-5 text-[13px] text-foreground">
            <p className="text-muted leading-relaxed">
              Pick the winner and series length for every matchup. Points double
              each round. The Finals has two bonus questions worth extra points.
              Max possible score is{" "}
              <span className="font-semibold text-foreground">52 pts</span>.
            </p>

            {/* Point table */}
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-raised/40">
                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted/60">
                      Round
                    </th>
                    <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted/60">
                      Correct winner
                    </th>
                    <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted/60">
                      Correct series length
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { round: "Round 1", winner: 1, series: 1 },
                    { round: "Round 2", winner: 2, series: 1 },
                    { round: "Conf. Finals", winner: 4, series: 1 },
                    { round: "NBA Finals", winner: 8, series: 1 },
                  ].map(({ round, winner, series }) => (
                    <tr
                      key={round}
                      className="border-b border-border/50 last:border-b-0"
                    >
                      <td className="px-4 py-2.5 text-foreground">{round}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-orange-400">
                        +{winner} pt{winner !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-muted">
                        +{series} pt
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bonus rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                <span className="text-foreground">
                  Finals MVP (correct name)
                </span>
                <span className="font-mono text-orange-400">+5 pts</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                <span className="text-foreground">
                  Combined score, last Finals game
                </span>
                <span className="text-[12px] text-muted">
                  Tiebreaker — closest wins
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
