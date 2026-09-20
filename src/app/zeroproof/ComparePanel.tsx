"use client";

import { useState } from "react";
import {
  compareStats,
  leadSummary,
  rankByMetric,
} from "@/lib/zeroproof/compare";
import {
  formatAmerican,
  formatCents,
  playerHandle,
} from "@/lib/zeroproof/format";
import type {
  LeaderboardEntry,
  ProfileStats,
  ZeroproofBet,
} from "@/lib/zeroproof/schemas";

const WINNER = "font-semibold text-success-600 dark:text-success-300";

/**
 * How I stack up against a chosen player from the leaderboard: my stats next to
 * theirs, who leads each measure, where I'd rank on the board, and my own open
 * bets alongside. The leaderboard is anonymised and picks are private, so this
 * compares records, not which side each of us took.
 */
export default function ComparePanel({
  myStats,
  entries,
  openBets,
}: {
  myStats: ProfileStats;
  entries: LeaderboardEntry[];
  openBets: ZeroproofBet[];
}) {
  const [selectedSub, setSelectedSub] = useState(
    entries[0]?.userSub ?? "",
  );

  if (entries.length === 0) {
    return (
      <section aria-labelledby="compare-title" className="mt-12">
        <h2 id="compare-title" className="text-xl font-semibold text-foreground">
          How you stack up
        </h2>
        <p className="mt-4 text-sm text-muted">
          No one else is on the board yet. Once other players have graded bets,
          you can measure yourself against them here.
        </p>
      </section>
    );
  }

  const opponent =
    entries.find((entry) => entry.userSub === selectedSub) ?? entries[0];
  const opponentHandle = playerHandle(opponent.userSub);
  const metrics = compareStats(myStats, opponent);
  const { mineLeads, theirsLeads, comparable } = leadSummary(metrics);
  const roiRank = rankByMetric(entries, myStats, "roiPct");

  const summary =
    mineLeads > theirsLeads
      ? `You lead ${mineLeads} of ${comparable} measures.`
      : theirsLeads > mineLeads
        ? `${opponentHandle} leads ${theirsLeads} of ${comparable} measures.`
        : `Even — ${mineLeads} apiece of ${comparable} measures.`;

  return (
    <section aria-labelledby="compare-title" className="mt-12 space-y-6">
      <div>
        <h2 id="compare-title" className="text-xl font-semibold text-foreground">
          How you stack up
        </h2>
        <p className="mt-1 text-sm text-muted">
          You&rsquo;d rank{" "}
          <span className="font-medium text-foreground">
            #{roiRank.rank} of {roiRank.total}
          </span>{" "}
          by ROI. Pick a player to compare against.
        </p>
      </div>

      <div>
        <label
          htmlFor="compare-opponent"
          className="block text-xs font-medium text-muted"
        >
          Compare against
        </label>
        <select
          id="compare-opponent"
          value={selectedSub}
          onChange={(event) => setSelectedSub(event.target.value)}
          className="mt-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
        >
          {entries.map((entry) => (
            <option key={entry.userSub} value={entry.userSub}>
              {playerHandle(entry.userSub)}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm font-medium text-foreground" role="status">
        {summary}
      </p>

      <table className="w-full text-sm">
        <caption className="sr-only">
          Your stats compared with {opponentHandle}
        </caption>
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            <th scope="col" className="py-2 text-left font-medium">
              Measure
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              You
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {opponentHandle}
            </th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.key} className="border-b border-border/60">
              <th scope="row" className="py-2 text-left font-normal text-muted">
                {metric.label}
              </th>
              <td
                className={`py-2 text-right font-mono tabular-nums ${
                  metric.leader === "mine" ? WINNER : "text-foreground"
                }`}
              >
                {metric.mine}
                {metric.leader === "mine" ? (
                  <span className="sr-only"> (you lead)</span>
                ) : null}
              </td>
              <td
                className={`py-2 text-right font-mono tabular-nums ${
                  metric.leader === "theirs" ? WINNER : "text-foreground"
                }`}
              >
                {metric.theirs}
                {metric.leader === "theirs" ? (
                  <span className="sr-only"> (they lead)</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section aria-labelledby="compare-upcoming-title">
        <h3
          id="compare-upcoming-title"
          className="text-sm font-semibold text-foreground"
        >
          Your upcoming bets
        </h3>
        {openBets.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {openBets.map((bet) => (
              <li
                key={bet.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm"
              >
                <span className="text-foreground">{bet.selection}</span>
                <span className="font-mono tabular-nums text-muted">
                  {formatAmerican(bet.oddsAmerican)} · {formatCents(bet.stakeCents)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No open bets right now.</p>
        )}
      </section>

      <p className="text-xs text-muted">
        Records only — the board is anonymous and picks are private, so which
        bets you two agreed or disagreed on isn&rsquo;t shown.
      </p>
    </section>
  );
}
