"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  eventsResponseSchema,
  leaderboardResponseSchema,
} from "@/lib/zeroproof/schemas";
import type {
  ZeroproofEvent,
  LeaderboardEntry,
} from "@/lib/zeroproof/schemas";
import {
  formatAmerican,
  formatPoint,
  formatRecord,
  marketLabel,
  playerHandle,
  sortMarkets,
} from "@/lib/zeroproof/format";

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

/** Weekday + time, in the reader's own locale. */
function formatKickoff(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function OutcomeRow({
  name,
  point,
  price,
}: {
  name: string;
  point: number | undefined;
  price: number;
}) {
  const line = formatPoint(point);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
      <span className="truncate text-foreground">
        {name}
        {line && <span className="ml-1 text-muted">{line}</span>}
      </span>
      <span className="font-mono tabular-nums text-foreground">
        {formatAmerican(price)}
      </span>
    </div>
  );
}

function EventCard({ event }: { event: ZeroproofEvent }) {
  return (
    <li className="rounded-2xl border border-border bg-surface/50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-foreground">
          <span>{event.away}</span>
          <span className="mx-2 text-muted" aria-label="at">
            @
          </span>
          <span>{event.home}</span>
        </h3>
        <p className="text-xs text-muted">
          <time dateTime={event.commenceTime}>
            {formatKickoff(event.commenceTime)}
          </time>
        </p>
      </div>

      {event.markets.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No lines posted yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {sortMarkets(event.markets).map((market) => (
            <section key={market.market} aria-label={marketLabel(market.market)}>
              <h4 className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
                {marketLabel(market.market)}
              </h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {market.outcomes.map((outcome) => (
                  <OutcomeRow
                    key={`${outcome.name}-${outcome.point ?? ""}`}
                    name={outcome.name}
                    point={outcome.point}
                    price={outcome.priceAmerican}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </li>
  );
}

function Slate() {
  const eventsQuery = useQuery({
    queryKey: queryKeys.zeroproof.events(),
    queryFn: () => getJson("/api/zeroproof/events"),
    select: (json) => eventsResponseSchema.parse(json),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section aria-labelledby="slate-title" className="mt-10">
      <h2 id="slate-title" className="text-xl font-semibold text-foreground">
        The board
      </h2>
      <p className="mt-1 text-sm text-muted">
        Upcoming events with the latest lines, served from the database — no
        vendor call rides on this page.
      </p>

      {eventsQuery.isLoading && (
        <p className="mt-6 text-sm text-muted" role="status">
          Loading the board…
        </p>
      )}

      {eventsQuery.isError && (
        <p className="mt-6 text-sm text-error-600 dark:text-error-300">
          The board is unavailable right now.
        </p>
      )}

      {eventsQuery.data && eventsQuery.data.events.length === 0 && (
        <p className="mt-6 text-sm text-muted">
          No upcoming events on the board right now.
        </p>
      )}

      {eventsQuery.data && eventsQuery.data.events.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {eventsQuery.data.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ul>
      )}
    </section>
  );
}

function formatRoi(roiPct: number): string {
  return `${roiPct > 0 ? "+" : ""}${roiPct}%`;
}

function LeaderboardRow({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: number;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-3 text-muted tabular-nums">{rank}</td>
      <td className="py-2 pr-3 font-mono text-foreground">
        {playerHandle(entry.userSub)}
      </td>
      <td className="py-2 pr-3 tabular-nums text-muted">
        {formatRecord(entry)}
      </td>
      <td className="py-2 pr-3 text-right tabular-nums text-foreground">
        {formatRoi(entry.roiPct)}
      </td>
      <td className="py-2 text-right font-medium tabular-nums text-foreground">
        {entry.sharpScore === null ? "—" : entry.sharpScore}
      </td>
    </tr>
  );
}

function Leaderboard() {
  const boardQuery = useQuery({
    queryKey: queryKeys.zeroproof.leaderboard(),
    queryFn: () => getJson("/api/zeroproof/leaderboard"),
    select: (json) => leaderboardResponseSchema.parse(json),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section aria-labelledby="leaderboard-title" className="mt-12">
      <h2 id="leaderboard-title" className="text-xl font-semibold text-foreground">
        The sharp leaderboard
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Ranked by a sharp score — closing-line value rolled up with return and
        volume, so it rewards beating the market, not just getting lucky.
        Players are shown by an opaque handle; nobody&apos;s account is on
        display.
      </p>

      {boardQuery.isLoading && (
        <p className="mt-6 text-sm text-muted" role="status">
          Loading the leaderboard…
        </p>
      )}

      {boardQuery.isError && (
        <p className="mt-6 text-sm text-error-600 dark:text-error-300">
          The leaderboard is unavailable right now.
        </p>
      )}

      {boardQuery.data && boardQuery.data.entries.length === 0 && (
        <p className="mt-6 text-sm text-muted">
          No ranked players yet — the board fills once enough bets are graded.
        </p>
      )}

      {boardQuery.data && boardQuery.data.entries.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table
            aria-label="Leaderboard"
            className="w-full min-w-[28rem] text-left text-sm"
          >
            <thead>
              <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
                <th scope="col" className="py-2 pr-3 font-medium">
                  #
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Player
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Record
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  ROI
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Sharp
                </th>
              </tr>
            </thead>
            <tbody>
              {boardQuery.data.entries.map((entry, i) => (
                <LeaderboardRow key={entry.userSub} entry={entry} rank={i + 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/**
 * The public face of ZeroProof: read-only for now. It reads the same slate the
 * bet slip will be built on, so the lobby is honest about what's live before a
 * single bet can be placed.
 */
export default function ZeroProofContent() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          ZeroProof
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Sports betting with the loss taken out: lock a deposit, bet real lines,
          get the deposit back at term end, and keep the record forever. The
          dollars are simulated on purpose;{" "}
          <Link
            className="underline underline-offset-4 hover:text-foreground"
            href="/thoughts/zeroproof"
          >
            the write-up
          </Link>{" "}
          explains why the ledger is real and the money is a button.
        </p>
      </header>

      <Slate />
      <Leaderboard />
    </div>
  );
}
