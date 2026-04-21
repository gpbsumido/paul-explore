"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { queryKeys } from "@/lib/queryKeys";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import type {
  LeaderboardEntry,
  LeaderboardRoundBreakdown,
  PlayoffLeaderboardResponse,
} from "@/types/nba";

// ---- Constants ----

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// ---- Types ----

type Props = {
  currentUserSub: string | null;
  /** Sub of the user whose bracket is currently being viewed (view mode). */
  viewSub?: string | null;
};

// ---- Sub-components ----

function LeaderboardSkeleton() {
  return (
    <div data-testid="leaderboard-skeleton" className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-12 w-full animate-pulse rounded-lg bg-surface-raised"
        />
      ))}
    </div>
  );
}

function RoundBadge({ label, earned, max }: LeaderboardRoundBreakdown) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-muted">
      {label} {earned}/{max}
    </span>
  );
}

function EntryRow({
  entry,
  isCurrentUser,
  isViewedUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  isViewedUser: boolean;
}) {
  const scorePct =
    entry.maxScore > 0 ? (entry.score / entry.maxScore) * 100 : 0;

  const viewHref = `/fantasy/nba/playoffs?view=${encodeURIComponent(entry.sub)}`;

  return (
    <motion.tr
      variants={fadeInUp}
      data-current-user={isCurrentUser ? "true" : undefined}
      onClick={() => {
        window.location.href = viewHref;
      }}
      className={[
        "border-b border-border/50 last:border-b-0 cursor-pointer transition-colors group",
        isCurrentUser
          ? "bg-orange-500/10 hover:bg-orange-500/15"
          : isViewedUser
            ? "bg-blue-500/8 hover:bg-blue-500/12"
            : "hover:bg-surface-raised/50",
      ].join(" ")}
    >
      {/* Rank */}
      <td className="w-10 px-3 py-3 text-center text-[14px]">
        {RANK_MEDALS[entry.rank] ?? (
          <span className="font-mono text-[13px] text-muted">{entry.rank}</span>
        )}
      </td>

      {/* Name */}
      <td className="px-3 py-3">
        <span
          className={[
            "text-[13px] font-medium",
            isCurrentUser
              ? "text-orange-400"
              : isViewedUser
                ? "text-blue-400"
                : "text-foreground",
          ].join(" ")}
        >
          {entry.displayName}
        </span>
      </td>

      {/* Score chip + progress bar */}
      <td className="px-3 py-3">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[12px] text-foreground tabular-nums">
            {entry.score} / {entry.maxScore} pts
          </span>
          <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-orange-500/60"
              initial={{ width: 0 }}
              animate={{ width: `${scorePct}%` }}
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 20,
                delay: 0.2,
              }}
            />
          </div>
        </div>
      </td>

      {/* Per-round breakdown */}
      <td className="hidden px-3 py-3 sm:table-cell">
        <div className="flex flex-wrap gap-1">
          {entry.roundBreakdown.map((rb) => (
            <RoundBadge key={rb.label} {...rb} />
          ))}
        </div>
      </td>

      {/* View bracket arrow */}
      <td className="w-8 px-2 py-3 text-right">
        <a
          href={viewHref}
          onClick={(e) => e.stopPropagation()}
          aria-label={`View ${entry.displayName}'s bracket`}
          className="inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-foreground"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </td>
    </motion.tr>
  );
}

// ---- Main component ----

/** Public leaderboard for the current season's playoff bracket picks. */
export default function PlayoffLeaderboard({
  currentUserSub,
  viewSub = null,
}: Props) {
  const query = useQuery({
    queryKey: queryKeys.nba.playoffLeaderboard(),
    queryFn: async (): Promise<PlayoffLeaderboardResponse> => {
      const res = await fetch("/api/nba/playoffs/leaderboard");
      if (!res.ok) throw new Error("Failed to load leaderboard");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  if (query.isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (query.isError) {
    return (
      <p className="py-6 text-center text-[13px] text-muted">
        {query.error instanceof Error
          ? query.error.message
          : "Could not load leaderboard"}
      </p>
    );
  }

  const entries = query.data?.entries ?? [];

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted">
        No brackets submitted yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface-raised/30">
            <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted/60">
              #
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted/60">
              Name
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted/60">
              Score
            </th>
            <th className="hidden px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted/60 sm:table-cell">
              Breakdown
            </th>
            <th className="w-8 px-2 py-2" />
          </tr>
        </thead>
        <motion.tbody
          variants={staggerContainer(0.04)}
          initial="hidden"
          animate="visible"
        >
          {entries.map((entry) => (
            <EntryRow
              key={entry.sub || String(entry.rank)}
              entry={entry}
              isCurrentUser={entry.sub === currentUserSub}
              isViewedUser={entry.sub === viewSub}
            />
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}
