"use client";

import type { PlayoffTeam, PlayoffSeriesPick } from "@/types/nba";

// ---- Constants ----

const SERIES_SCORES = ["4-0", "4-1", "4-2", "4-3"] as const;

// ---- Types ----

export type SeriesPickCardProps = {
  matchupId: string;
  topTeam: PlayoffTeam;
  bottomTeam: PlayoffTeam;
  pick: PlayoffSeriesPick | undefined;
  onPick: (matchupId: string, pick: PlayoffSeriesPick) => void;
  /** Disable all interaction — used when both teams are still unresolved TBDs. */
  disabled?: boolean;
};

// ---- Sub-components ----

function TeamButton({
  team,
  isWinner,
  onClick,
  disabled = false,
}: {
  team: PlayoffTeam;
  isWinner: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const isTbd = team.abbreviation === "?" || team.abbreviation === "TBD";

  return (
    <button
      type="button"
      aria-pressed={isWinner}
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors",
        disabled ? "" : "cursor-pointer",
        isWinner
          ? "bg-orange-500/20 font-semibold text-orange-400"
          : isTbd
            ? "text-muted/60 hover:bg-surface-raised"
            : "text-foreground hover:bg-surface-raised",
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

// ---- Main component ----

/** Shows two teams for a playoff series and lets the user pick a winner + series score. */
export default function SeriesPickCard({
  matchupId,
  topTeam,
  bottomTeam,
  pick,
  onPick,
  disabled = false,
}: SeriesPickCardProps) {
  function handleTeamClick(team: PlayoffTeam) {
    onPick(matchupId, {
      winner: team.abbreviation,
      seriesScore: pick?.seriesScore ?? "4-0",
    });
  }

  function handleScoreChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onPick(matchupId, {
      winner: pick?.winner ?? "",
      seriesScore: e.target.value,
    });
  }

  return (
    <div
      className={[
        "space-y-1 rounded-xl border border-border bg-surface p-2",
        disabled ? "opacity-40" : "",
      ].join(" ")}
    >
      <TeamButton
        team={topTeam}
        isWinner={pick?.winner === topTeam.abbreviation}
        onClick={() => handleTeamClick(topTeam)}
        disabled={disabled}
      />
      <TeamButton
        team={bottomTeam}
        isWinner={pick?.winner === bottomTeam.abbreviation}
        onClick={() => handleTeamClick(bottomTeam)}
        disabled={disabled}
      />

      <div className="border-t border-border pt-1.5">
        <label className="sr-only" htmlFor={`score-${matchupId}`}>
          Series score
        </label>
        <select
          id={`score-${matchupId}`}
          aria-label="Series score"
          value={pick?.seriesScore ?? ""}
          onChange={handleScoreChange}
          disabled={disabled}
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
    </div>
  );
}
