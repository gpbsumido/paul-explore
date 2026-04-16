"use client";

import { useState } from "react";
import type { PlayoffTeam, FinalsPick } from "@/types/nba";

// ---- Constants ----

const SERIES_SCORES = ["4-0", "4-1", "4-2", "4-3"] as const;

// ---- Types ----

export type FinalsCardProps = {
  matchupId: string;
  topTeam: PlayoffTeam;
  bottomTeam: PlayoffTeam;
  pick: FinalsPick | undefined;
  onPick: (matchupId: string, pick: FinalsPick) => void;
};

// ---- Sub-components ----

function TeamButton({
  team,
  isWinner,
  onClick,
}: {
  team: PlayoffTeam;
  isWinner: boolean;
  onClick: () => void;
}) {
  const isTbd = team.abbreviation === "?" || team.abbreviation === "TBD";

  return (
    <button
      type="button"
      aria-pressed={isWinner}
      disabled={isTbd}
      onClick={onClick}
      className={[
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors",
        isWinner
          ? "bg-orange-500/20 font-semibold text-orange-400"
          : "text-foreground hover:bg-surface-raised",
        isTbd ? "cursor-default opacity-40" : "cursor-pointer",
      ].join(" ")}
    >
      <span className="w-4 shrink-0 text-[11px] text-muted/60">
        {team.seed > 0 ? team.seed : "?"}
      </span>
      <span className="font-mono text-[13px]">{team.abbreviation}</span>
      {isWinner && (
        <svg
          className="ml-auto h-3.5 w-3.5 text-orange-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

// ---- Helpers ----

function emptyFinalsPick(base?: Partial<FinalsPick>): FinalsPick {
  return {
    winner: "",
    seriesScore: "4-0",
    lastGameCombinedScore: null,
    mvp: "",
    ...base,
  };
}

// ---- Main component ----

/** Finals series card: pick a winner + score, and enter combined score + MVP. */
export default function FinalsCard({
  matchupId,
  topTeam,
  bottomTeam,
  pick,
  onPick,
}: FinalsCardProps) {
  const current = pick ?? emptyFinalsPick();

  // Local state for free-form inputs so userEvent.type accumulates correctly
  // even when the parent holds the pick in state and re-renders are async.
  const [localCombinedScore, setLocalCombinedScore] = useState<string>(() =>
    pick?.lastGameCombinedScore != null
      ? String(pick.lastGameCombinedScore)
      : "",
  );
  const [localMvp, setLocalMvp] = useState<string>(() => pick?.mvp ?? "");

  function handleTeamClick(team: PlayoffTeam) {
    onPick(matchupId, { ...current, winner: team.abbreviation });
  }

  function handleScoreChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onPick(matchupId, { ...current, seriesScore: e.target.value });
  }

  function handleCombinedScoreChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setLocalCombinedScore(raw);
    const parsed = raw === "" ? null : Number(raw);
    onPick(matchupId, {
      ...current,
      lastGameCombinedScore: Number.isNaN(parsed) ? null : parsed,
    });
  }

  function handleMvpChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalMvp(e.target.value);
    onPick(matchupId, { ...current, mvp: e.target.value });
  }

  return (
    <div className="space-y-1 rounded-xl border border-border bg-surface p-2">
      <TeamButton
        team={topTeam}
        isWinner={current.winner === topTeam.abbreviation}
        onClick={() => handleTeamClick(topTeam)}
      />
      <TeamButton
        team={bottomTeam}
        isWinner={current.winner === bottomTeam.abbreviation}
        onClick={() => handleTeamClick(bottomTeam)}
      />

      {/* Series score */}
      <div className="border-t border-border pt-1.5">
        <label className="sr-only" htmlFor={`score-${matchupId}`}>
          Series score
        </label>
        <select
          id={`score-${matchupId}`}
          aria-label="Series score"
          value={current.seriesScore}
          onChange={handleScoreChange}
          className="h-8 w-full rounded-lg border border-border bg-surface px-2 text-[12px] text-foreground outline-none"
        >
          <option value="">Score</option>
          {SERIES_SCORES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Combined score, last game */}
      <div className="space-y-1 pt-1">
        <label
          htmlFor={`combined-${matchupId}`}
          className="block text-[11px] text-muted"
        >
          Combined score, last game
        </label>
        <input
          id={`combined-${matchupId}`}
          type="number"
          min={0}
          placeholder="e.g. 215"
          value={localCombinedScore}
          onChange={handleCombinedScoreChange}
          className="h-8 w-full rounded-lg border border-border bg-surface px-2 text-[12px] text-foreground placeholder:text-muted/40 outline-none"
        />
      </div>

      {/* Finals MVP */}
      <div className="space-y-1">
        <label
          htmlFor={`mvp-${matchupId}`}
          className="block text-[11px] text-muted"
        >
          Finals MVP
        </label>
        <input
          id={`mvp-${matchupId}`}
          type="text"
          placeholder="e.g. SGA"
          value={localMvp}
          onChange={handleMvpChange}
          className="h-8 w-full rounded-lg border border-border bg-surface px-2 text-[12px] text-foreground placeholder:text-muted/40 outline-none"
        />
      </div>
    </div>
  );
}
