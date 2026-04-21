"use client";

import { motion, AnimatePresence } from "framer-motion";
import { getTeamInfo, getTeamLogoUrl } from "@/lib/nbaTeamColors";
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
  const teamInfo = getTeamInfo(team.abbreviation);
  const logoUrl = getTeamLogoUrl(team.teamId);

  return (
    <motion.button
      type="button"
      aria-pressed={isWinner}
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      className={[
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all duration-150",
        disabled ? "" : "cursor-pointer",
        !isWinner && !isTbd ? "hover:bg-surface-raised" : "",
        !isWinner && isTbd ? "text-muted/50 hover:bg-surface-raised" : "",
      ].join(" ")}
      style={
        isWinner && teamInfo
          ? {
              backgroundColor: `${teamInfo.primary}18`,
              borderLeft: `3px solid ${teamInfo.primary}`,
              paddingLeft: "9px",
              color: teamInfo.primary,
              fontWeight: 600,
            }
          : {}
      }
    >
      {/* Team logo */}
      {logoUrl && !isTbd ? (
        <img
          src={logoUrl}
          alt=""
          role="presentation"
          width={22}
          height={22}
          loading="lazy"
          className="shrink-0 rounded-full object-contain"
        />
      ) : (
        <span className="block h-[22px] w-[22px] shrink-0 rounded-full bg-surface-raised/60" />
      )}

      {/* Seed */}
      <span className="w-4 shrink-0 text-[10px] text-muted/50">
        {team.seed > 0 ? team.seed : "?"}
      </span>

      {/* Abbreviation */}
      <span className="font-mono text-[13px]">{team.abbreviation}</span>

      {/* Winner checkmark */}
      <AnimatePresence>
        {isWinner && (
          <motion.svg
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="ml-auto h-3.5 w-3.5 shrink-0"
            style={
              teamInfo ? { color: teamInfo.primary } : { color: "#f97316" }
            }
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
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
  const winnerInfo =
    pick?.winner === topTeam.abbreviation
      ? getTeamInfo(topTeam.abbreviation)
      : pick?.winner === bottomTeam.abbreviation
        ? getTeamInfo(bottomTeam.abbreviation)
        : undefined;

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
        "overflow-hidden rounded-xl border bg-surface transition-all duration-200",
        disabled ? "opacity-40" : "",
      ].join(" ")}
      style={
        pick?.winner && winnerInfo
          ? {
              borderColor: `${winnerInfo.primary}35`,
              boxShadow: `0 0 0 1px ${winnerInfo.primary}15, 0 2px 10px ${winnerInfo.primary}12`,
            }
          : { borderColor: "var(--color-border)" }
      }
    >
      <div className="space-y-0.5 p-1.5">
        <TeamButton
          team={topTeam}
          isWinner={pick?.winner === topTeam.abbreviation}
          onClick={() => handleTeamClick(topTeam)}
          disabled={disabled}
        />
        <div className="mx-2.5 h-px bg-border/40" />
        <TeamButton
          team={bottomTeam}
          isWinner={pick?.winner === bottomTeam.abbreviation}
          onClick={() => handleTeamClick(bottomTeam)}
          disabled={disabled}
        />
      </div>

      <div className="border-t border-border/60 px-2 py-1.5">
        <label className="sr-only" htmlFor={`score-${matchupId}`}>
          Series score
        </label>
        <select
          id={`score-${matchupId}`}
          aria-label="Series score"
          value={pick?.seriesScore ?? ""}
          onChange={handleScoreChange}
          disabled={disabled}
          className="h-7 w-full rounded-md border border-border/60 bg-surface px-2 text-[11px] text-foreground outline-none"
          style={
            pick?.seriesScore && winnerInfo
              ? {
                  borderColor: `${winnerInfo.primary}40`,
                  color: winnerInfo.primary,
                }
              : {}
          }
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
