"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  formatCents,
  formatRecord,
  formatSignedPct,
  playerHandle,
} from "@/lib/zeroproof/format";
import {
  type LeagueDetail,
  leagueDetailResponseSchema,
} from "@/lib/zeroproof/schemas";

async function fetchLeagueDetail(id: string): Promise<LeagueDetail> {
  const res = await fetch(`/api/zeroproof/leagues/${id}`);
  if (res.status === 404) throw new Error("This league doesn't exist.");
  if (!res.ok) throw new Error(`Couldn't load the league (${res.status})`);
  return leagueDetailResponseSchema.parse(await res.json());
}

function ruleLine(detail: LeagueDetail): string {
  const { league } = detail;
  const win =
    league.winCondition === "threshold" && league.thresholdCents != null
      ? `first to ${formatCents(league.thresholdCents)}`
      : league.winCondition === "timeline" && league.endsAt
        ? `highest by ${new Date(league.endsAt).toLocaleDateString()}`
        : league.winCondition;
  return `${league.memberCount}/${league.maxMembers} members · ${win} · ${formatCents(
    league.startingBankrollCents,
  )} to start`;
}

const primaryButtonClass =
  "inline-flex h-9 items-center rounded-full bg-primary-600 px-4 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none disabled:opacity-60";

function JoinAction({ detail }: { detail: LeagueDetail }) {
  const queryClient = useQueryClient();
  const { league } = detail;
  const join = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/zeroproof/leagues/${league.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(league.joinCode ? { joinCode: league.joinCode } : {}),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Couldn't join (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zeroproof.league(league.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.zeroproof.myLeagues() });
    },
  });

  if (league.visibility === "invite") {
    // An invite league can't be joined from the public page without the code;
    // the commissioner shares it out of band.
    return <p className="text-sm text-muted">Invite only — ask the commissioner for the code.</p>;
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => join.mutate()}
        disabled={join.isPending}
        className={primaryButtonClass}
      >
        {join.isPending ? "Joining…" : "Join this league"}
      </button>
      {join.isError && (
        <p className="mt-2 text-xs text-error-600 dark:text-error-300">
          {(join.error as Error).message}
        </p>
      )}
    </div>
  );
}

export default function LeagueDetailContent({ leagueId }: { leagueId: string }) {
  const query = useQuery({
    queryKey: queryKeys.zeroproof.league(leagueId),
    queryFn: () => fetchLeagueDetail(leagueId),
  });

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-foreground">{(query.error as Error)?.message ?? "Couldn't load this league."}</p>
        <Link href="/zeroproof" className="mt-3 inline-block text-sm text-primary-600 underline">
          Back to ZeroProof
        </Link>
      </div>
    );
  }

  const detail = query.data;
  const { league, standings } = detail;
  const joinable = league.status === "open" && league.memberCount < league.maxMembers && !detail.isMember;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{league.name}</h1>
        <p className="mt-1 text-sm text-muted">{ruleLine(detail)}</p>
        {league.espnLeagueId && (
          <p className="mt-1 text-sm text-muted">
            Bets only ESPN{" "}
            {league.espnGame === "fba" ? "basketball" : league.espnGame === "ffl" ? "football" : league.espnGame}{" "}
            league <span className="font-mono text-foreground">{league.espnLeagueId}</span>
            {league.espnSeason ? ` (${league.espnSeason})` : ""}.
          </p>
        )}
      </header>

      {league.status === "settled" && league.winnerSub && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-primary-500/40 bg-primary-500/10 px-4 py-3 text-sm font-medium text-foreground"
        >
          Winner: {playerHandle(league.winnerSub)}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        {joinable && <JoinAction detail={detail} />}
        {detail.isMember && (
          <>
            <Link href="/zeroproof" className={primaryButtonClass}>
              Bet from the board
            </Link>
            {league.joinCode && (
              <p className="text-sm text-muted">
                Invite code:{" "}
                <span className="font-mono font-medium text-foreground">{league.joinCode}</span>
              </p>
            )}
          </>
        )}
      </div>
      {detail.isMember && (
        <p className="mt-2 text-xs text-muted">
          Your league wallet is in the bet slip&apos;s wallet picker on the board.
        </p>
      )}

      <section aria-labelledby="standings-title" className="mt-8">
        <h2 id="standings-title" className="text-sm font-semibold tracking-wide text-muted uppercase">
          Standings
        </h2>
        {standings.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No bets settled yet — the board is level.</p>
        ) : (
          <table className="mt-3 w-full text-sm" aria-label={`${league.name} standings`}>
            <thead>
              <tr className="text-left text-xs text-muted">
                <th scope="col" className="py-2 pr-2 font-medium">#</th>
                <th scope="col" className="py-2 pr-2 font-medium">Player</th>
                <th scope="col" className="py-2 pr-2 text-right font-medium">Bankroll</th>
                <th scope="col" className="py-2 pr-2 text-right font-medium">ROI</th>
                <th scope="col" className="py-2 text-right font-medium">Record</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => {
                const isWinner = row.userSub === league.winnerSub;
                return (
                  <tr
                    key={row.userSub}
                    className={`border-t border-border ${isWinner ? "font-semibold text-foreground" : "text-foreground"}`}
                  >
                    <td className="py-2 pr-2 tabular-nums">{row.rank}</td>
                    <td className="py-2 pr-2 font-mono">{playerHandle(row.userSub)}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{formatCents(row.balanceCents)}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{formatSignedPct(row.roiPct)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatRecord({ wins: row.wins, losses: row.losses, pushes: row.pushes })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
