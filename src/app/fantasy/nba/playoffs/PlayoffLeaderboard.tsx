"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
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
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  const scorePct =
    entry.maxScore > 0 ? (entry.score / entry.maxScore) * 100 : 0;

  return (
    <tr
      data-current-user={isCurrentUser ? "true" : undefined}
      className={[
        "border-b border-border/50 last:border-b-0 transition-colors",
        isCurrentUser ? "bg-orange-500/10" : "hover:bg-surface-raised/40",
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
            isCurrentUser ? "text-orange-400" : "text-foreground",
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
            <div
              className="h-full rounded-full bg-orange-500/60 transition-all"
              style={{ width: `${scorePct}%` }}
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
    </tr>
  );
}

// ---- Main component ----

/** Public leaderboard for the current season's playoff bracket picks. */
export default function PlayoffLeaderboard({ currentUserSub }: Props) {
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
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <EntryRow
              key={entry.sub || String(entry.rank)}
              entry={entry}
              isCurrentUser={entry.sub === currentUserSub}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
