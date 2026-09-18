"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { queryKeys } from "@/lib/queryKeys";
import FeatureTour from "@/components/GuidedTour/FeatureTour";
import type { TourStep } from "@/components/GuidedTour/types";
import AdminBetsLink from "./AdminBetsLink";
import OpenWalletActions from "./OpenWalletActions";
import LeaguesPanel from "./LeaguesPanel";
import QueryError from "./QueryError";
import { bankrollTrend } from "@/lib/zeroproof/trend";
import {
  netProfitTotalCents,
  winRatePct,
  recentForm,
} from "@/lib/zeroproof/analytics";
import WinCelebration from "./WinCelebration";
import ComparePanel from "./ComparePanel";
import {
  eventsResponseSchema,
  leaderboardResponseSchema,
  profileResponseSchema,
  betsResponseSchema,
} from "@/lib/zeroproof/schemas";
import type {
  ZeroproofEvent,
  LeaderboardEntry,
  ProfileStats,
  ZeroproofWallet,
  Accolade,
  ZeroproofBet,
} from "@/lib/zeroproof/schemas";
import {
  formatAmerican,
  formatCents,
  formatNetCents,
  formatPoint,
  formatRecord,
  formatSignedPct,
  formatStreak,
  marketLabel,
  playerHandle,
  sortMarkets,
} from "@/lib/zeroproof/format";
import Input from "@/components/ui/Input";
import {
  type BoardFilters,
  type BoardOddsFilter,
  type BoardTypeFilter,
  availableSports,
  dateRangeActive,
  dayLabel,
  DEFAULT_BOARD_FILTERS,
  fantasyLabel,
  filterBoardEvents,
  hasActiveFilters,
  hasMoreBeyondHorizon,
  isFantasySport,
  isPastFixture,
} from "@/lib/zeroproof/boardFilters";

/**
 * The bankroll-trend chart, code-split out of the lobby's initial bundle. It's
 * only on the "Your record" tab (below the fold, never the first view), so its
 * chart-geometry code shouldn't be parsed before the board can paint. A sized
 * skeleton holds its place so swapping it in doesn't shift the layout.
 */
const StackedLineChart = dynamic(
  () => import("@paul-portfolio/react").then((m) => m.StackedLineChart),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 h-56 animate-pulse rounded-lg bg-surface" aria-hidden />
    ),
  },
);

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

type SelectedBet = {
  eventId: string;
  eventLabel: string;
  market: string;
  selection: string;
  point: number | undefined;
  price: number;
};

function OutcomeButton({
  name,
  point,
  price,
  selected,
  onPick,
}: {
  name: string;
  point: number | undefined;
  price: number;
  selected: boolean;
  onPick: () => void;
}) {
  const line = formatPoint(point);
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none ${
        selected
          ? "border-primary-500 bg-primary-500/10"
          : "border-border bg-surface hover:border-primary-500/50 hover:bg-surface-raised"
      }`}
    >
      <span className="truncate text-foreground">
        {name}
        {line && <span className="ml-1 text-muted">{line}</span>}
      </span>
      <span className="font-mono tabular-nums text-foreground">
        {formatAmerican(price)}
      </span>
    </button>
  );
}

const BET_STATUS_STYLE: Record<string, string> = {
  won: "text-success-600 dark:text-success-300",
  lost: "text-error-600 dark:text-error-300",
  open: "text-primary-700 dark:text-primary-300",
  push: "text-muted",
  void: "text-muted",
};

function EventCard({
  event,
  selected,
  onPick,
  bets,
  readOnly = false,
}: {
  event: ZeroproofEvent;
  selected: SelectedBet | null;
  onPick: (bet: SelectedBet) => void;
  /** The caller's own bets on this fixture, if any. */
  bets: ZeroproofBet[];
  /** A past fixture: shown for reference, with lines you can't bet. */
  readOnly?: boolean;
}) {
  const label = `${event.away} @ ${event.home}`;
  return (
    <li className="rounded-2xl border border-border bg-surface/50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">
            <span>{event.away}</span>
            <span className="mx-2 text-muted" aria-label="at">
              @
            </span>
            <span>{event.home}</span>
          </h3>
          {bets.length > 0 && (
            <span className="rounded-full border border-primary-500/40 bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300">
              Your bet
            </span>
          )}
          {fantasyLabel(event.sport) && (
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-muted">
              {fantasyLabel(event.sport)}
            </span>
          )}
          {readOnly && (
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-muted">
              Final
            </span>
          )}
        </div>
        <p className="text-xs text-muted">
          <time dateTime={event.commenceTime}>
            {formatKickoff(event.commenceTime)}
          </time>
        </p>
      </div>

      {bets.length > 0 && (
        <ul
          aria-label="Your bets on this matchup"
          className="mt-3 space-y-1 rounded-lg border border-primary-500/30 bg-primary-500/5 px-3 py-2"
        >
          {bets.map((bet) => (
            <li
              key={bet.id}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs"
            >
              <span className="text-foreground">
                <span className="font-medium">{bet.selection}</span>{" "}
                <span className="text-muted">
                  {marketLabel(bet.market)}
                  {bet.lineValue !== null ? ` ${formatPoint(bet.lineValue)}` : ""}
                </span>
              </span>
              <span className="flex items-center gap-2 font-mono tabular-nums">
                <span className="text-muted">{formatCents(bet.stakeCents)}</span>
                <span className="text-foreground">
                  {formatAmerican(bet.oddsAmerican)}
                </span>
                {bet.status !== "open" && (
                  <span
                    className={`font-sans font-medium ${BET_STATUS_STYLE[bet.status]}`}
                  >
                    {bet.status}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

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
                {market.outcomes.map((outcome) => {
                  const key = `${outcome.name}-${outcome.point ?? ""}`;
                  if (readOnly) {
                    const line = formatPoint(outcome.point);
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm"
                      >
                        <span className="truncate text-muted">
                          {outcome.name}
                          {line && <span className="ml-1">{line}</span>}
                        </span>
                        <span className="font-mono tabular-nums text-muted">
                          {formatAmerican(outcome.priceAmerican)}
                        </span>
                      </div>
                    );
                  }
                  const isSelected =
                    selected !== null &&
                    selected.eventId === event.id &&
                    selected.market === market.market &&
                    selected.selection === outcome.name;
                  return (
                    <OutcomeButton
                      key={key}
                      name={outcome.name}
                      point={outcome.point}
                      price={outcome.priceAmerican}
                      selected={isSelected}
                      onPick={() =>
                        onPick({
                          eventId: event.id,
                          eventLabel: label,
                          market: market.market,
                          selection: outcome.name,
                          point: outcome.point,
                          price: outcome.priceAmerican,
                        })
                      }
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </li>
  );
}

const HORIZON_STEP_DAYS = 3;
// Past fixtures reveal in bigger steps than the upcoming horizon — it's browsing
// history, not the active betting window — up to a 3-month cap the backend serves.
const PAST_STEP_DAYS = 14;
const MAX_PAST_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;
const controlButton =
  "inline-flex h-8 items-center rounded-full border border-border bg-surface px-3 text-xs text-foreground transition-colors hover:border-primary-500/50 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none";
const filterSelect =
  "h-8 rounded-full border border-border bg-surface px-3 text-xs text-foreground transition-colors hover:border-primary-500/50 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none";

/**
 * Group kickoff-sorted events into day buckets. Events arrive sorted by
 * commence_time, so same-day events are already contiguous.
 */
function groupEventsByDay(
  events: ZeroproofEvent[],
): { key: string; label: string; events: ZeroproofEvent[] }[] {
  const groups: { key: string; label: string; events: ZeroproofEvent[] }[] = [];
  for (const event of events) {
    const label = dayLabel(event.commenceTime);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.events.push(event);
    else groups.push({ key: label, label, events: [event] });
  }
  return groups;
}

function Slate({
  selected,
  onPick,
}: {
  selected: SelectedBet | null;
  onPick: (bet: SelectedBet) => void;
}) {
  // Whether the board also shows recent finished fixtures, and how far back —
  // grown in steps as you load earlier, up to the 3-month cap.
  const [includePast, setIncludePast] = useState(false);
  const [daysBack, setDaysBack] = useState(0);

  const eventsQuery = useQuery({
    // daysBack is in the key so widening the past window refetches; the backend
    // returns just that window (?pastDays), so we fetch what we show, not 3
    // months up front. keepPreviousData holds the board steady while it loads.
    queryKey: [...queryKeys.zeroproof.events(), { includePast, daysBack }],
    queryFn: () =>
      getJson(
        includePast
          ? `/api/zeroproof/events?include=past&pastDays=${daysBack}`
          : "/api/zeroproof/events",
      ),
    select: (json) => eventsResponseSchema.parse(json),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  // How far out the board reaches, in days. Starts at 3 and grows by 3 each
  // "load more" (or automatically as you scroll, when that toggle is on).
  const [daysAhead, setDaysAhead] = useState(HORIZON_STEP_DAYS);
  const [autoLoad, setAutoLoad] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // The caller's bets, so a fixture they've already bet on is flagged on the
  // board — and always shown, even past the horizon. Reuses the profile's query
  // and returns [] when signed out.
  const betsQuery = useQuery({
    queryKey: queryKeys.zeroproof.bets(),
    queryFn: fetchBets,
    staleTime: 30 * 1000,
  });
  const betsByEvent = new Map<string, ZeroproofBet[]>();
  for (const bet of betsQuery.data ?? []) {
    const forEvent = betsByEvent.get(bet.eventId) ?? [];
    forEvent.push(bet);
    betsByEvent.set(bet.eventId, forEvent);
  }
  const betEventIds = new Set(betsByEvent.keys());

  // Captured once at mount so filtering is a pure function of state across
  // re-renders (a live-updating clock would make render impure).
  const [now] = useState(() => Date.now());
  const [boardFilters, setBoardFilters] = useState<BoardFilters>(DEFAULT_BOARD_FILTERS);
  const allEvents = eventsQuery.data?.events ?? [];

  const horizonCtx = { now, daysAhead, daysBack, dayMs: DAY_MS, betEventIds };
  const visibleEvents = filterBoardEvents(allEvents, boardFilters, horizonCtx);
  const hasMore = hasMoreBeyondHorizon(allEvents, boardFilters, horizonCtx);
  // We only fetch the window we're showing, so the loaded data can't tell us
  // whether older fixtures exist — offer "load earlier" until the 3-month cap.
  const hasEarlier = includePast && daysBack < MAX_PAST_DAYS;
  const dayGroups = groupEventsByDay(visibleEvents);

  // The sport options are narrowed by the type filter, so the two can never
  // contradict; changing the type resets the sport back to "all" for the same
  // reason (the previously chosen sport may no longer be offered).
  const typeScopedEvents = allEvents.filter((event) => {
    if (boardFilters.type === "sports") return !isFantasySport(event.sport);
    if (boardFilters.type === "fantasy") return isFantasySport(event.sport);
    return true;
  });
  const sportOptions = availableSports(typeScopedEvents);
  const filtersActive = hasActiveFilters(boardFilters);
  const rangeActive = dateRangeActive(boardFilters);
  const dateSummary = [
    boardFilters.from && `from ${boardFilters.from}`,
    boardFilters.to && `to ${boardFilters.to}`,
  ]
    .filter(Boolean)
    .join(" ");
  const clearFilters = () => setBoardFilters(DEFAULT_BOARD_FILTERS);

  // Auto lazy-load: when the toggle is on, extend the horizon as the sentinel at
  // the bottom of the list scrolls into view. Guarded for environments without
  // IntersectionObserver; the manual "load more" button is the fallback.
  useEffect(() => {
    if (!autoLoad || !hasMore) return;
    if (typeof IntersectionObserver === "undefined") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setDaysAhead((days) => days + HORIZON_STEP_DAYS);
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [autoLoad, hasMore, visibleEvents.length]);

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
        <QueryError
          message="The board is unavailable right now."
          onRetry={() => eventsQuery.refetch()}
        />
      )}

      {eventsQuery.data && allEvents.length === 0 && (
        <p className="mt-6 text-sm text-muted">
          No upcoming events on the board right now.
        </p>
      )}

      {eventsQuery.data && allEvents.length > 0 && (
        <>
          {/* Sticky below the site header (a sticky top-0 h-14 bar) so the
              controls stay visible while you scroll the board. */}
          <div className="sticky top-14 z-20 mt-4 flex flex-col gap-2 rounded-lg border border-border bg-background/85 px-3 py-2 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted">Filter</span>
              <label className="sr-only" htmlFor="board-filter-type">
                Show sports or fantasy
              </label>
              <select
                id="board-filter-type"
                className={filterSelect}
                value={boardFilters.type}
                onChange={(event) =>
                  setBoardFilters((filters) => ({
                    ...filters,
                    type: event.target.value as BoardTypeFilter,
                    sport: "all",
                  }))
                }
              >
                <option value="all">All types</option>
                <option value="sports">Sports only</option>
                <option value="fantasy">Fantasy only</option>
              </select>

              {sportOptions.length > 1 && (
                <>
                  <label className="sr-only" htmlFor="board-filter-sport">
                    Sport
                  </label>
                  <select
                    id="board-filter-sport"
                    className={filterSelect}
                    value={boardFilters.sport}
                    onChange={(event) =>
                      setBoardFilters((filters) => ({ ...filters, sport: event.target.value }))
                    }
                  >
                    <option value="all">All sports</option>
                    {sportOptions.map((sport) => (
                      <option key={sport.sport} value={sport.sport}>
                        {sport.label}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div className="flex items-center gap-1">
                <span className="text-xs text-muted">Dates</span>
                <Input
                  label="From date"
                  hideLabel
                  type="date"
                  size="sm"
                  value={boardFilters.from}
                  onChange={(event) =>
                    setBoardFilters((filters) => ({ ...filters, from: event.target.value }))
                  }
                />
                <span className="text-xs text-muted">to</span>
                <Input
                  label="To date"
                  hideLabel
                  type="date"
                  size="sm"
                  value={boardFilters.to}
                  onChange={(event) =>
                    setBoardFilters((filters) => ({ ...filters, to: event.target.value }))
                  }
                />
              </div>

              <label className="sr-only" htmlFor="board-filter-odds">
                Odds
              </label>
              <select
                id="board-filter-odds"
                className={filterSelect}
                value={boardFilters.odds}
                onChange={(event) =>
                  setBoardFilters((filters) => ({
                    ...filters,
                    odds: event.target.value as BoardOddsFilter,
                  }))
                }
              >
                <option value="all">Any odds</option>
                <option value="favorites">Big favorites</option>
                <option value="underdogs">Longshots</option>
                <option value="even">Even matchups</option>
              </select>

              <label className="flex items-center gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={includePast}
                  onChange={(event) => {
                    const on = event.target.checked;
                    setIncludePast(on);
                    setDaysBack(on ? PAST_STEP_DAYS : 0);
                  }}
                  className="h-4 w-4 rounded border-border text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600"
                />
                Show past fixtures
              </label>

              {filtersActive && (
                <button type="button" onClick={clearFilters} className={controlButton}>
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted" aria-live="polite">
                {rangeActive
                  ? `Showing games ${dateSummary}`
                  : `Showing games in the next ${daysAhead} days`}
                {` — ${visibleEvents.length} ${visibleEvents.length === 1 ? "game" : "games"}`}
              </p>
              {!rangeActive && (
                <div className="flex flex-wrap items-center gap-3">
                  {daysAhead > HORIZON_STEP_DAYS && (
                    <button
                      type="button"
                      onClick={() => setDaysAhead(HORIZON_STEP_DAYS)}
                      className={controlButton}
                    >
                      Show only next 3 days
                    </button>
                  )}
                  <label className="flex items-center gap-2 text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={autoLoad}
                      onChange={(event) => setAutoLoad(event.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600"
                    />
                    Auto-load as I scroll
                  </label>
                </div>
              )}
            </div>
          </div>

          {visibleEvents.length === 0 ? (
            <p className="mt-6 text-sm text-muted">
              {hasMore
                ? `No games in the next ${daysAhead} days${filtersActive ? " match your filters" : ""}.`
                : filtersActive
                  ? "No games match your filters. Clear the filters to see the full board."
                  : `Nothing kicks off in the next ${daysAhead} days.`}
            </p>
          ) : (
            <div className="mt-6 space-y-8">
              {dayGroups.map((group) => (
                <div key={group.key}>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    {group.label}
                  </h3>
                  <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {group.events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        selected={selected}
                        onPick={onPick}
                        bets={betsByEvent.get(event.id) ?? []}
                        readOnly={isPastFixture(event, now)}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
              {autoLoad ? (
                <p className="text-xs text-muted" role="status">
                  Loading more as you scroll…
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setDaysAhead((days) => days + HORIZON_STEP_DAYS)}
                  className={controlButton}
                >
                  Load more games
                </button>
              )}
            </div>
          )}

          {hasEarlier && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  setDaysBack((days) =>
                    Math.min(days + PAST_STEP_DAYS, MAX_PAST_DAYS),
                  )
                }
                className={controlButton}
              >
                Load earlier fixtures
              </button>
            </div>
          )}
        </>
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
  // Default to ROI, not Sharp: the sharp board withholds anyone below its volume
  // floor, so at low volume it reads empty even when settled bets exist. ROI
  // ranks everyone with a graded bet, so the board isn't blank on arrival.
  const [board, setBoard] = useState<"sharp" | "roi">("roi");
  const boardQuery = useQuery({
    queryKey: queryKeys.zeroproof.leaderboard(board),
    queryFn: () => getJson(`/api/zeroproof/leaderboard?board=${board}`),
    select: (json) => leaderboardResponseSchema.parse(json),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section aria-labelledby="leaderboard-title" className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="leaderboard-title"
          className="text-xl font-semibold text-foreground"
        >
          The leaderboard
        </h2>
        <div
          role="tablist"
          aria-label="Leaderboard ranking"
          className="flex rounded-full border border-border bg-surface p-0.5 text-xs"
        >
          {(["sharp", "roi"] as const).map((b) => (
            <button
              key={b}
              type="button"
              role="tab"
              aria-selected={board === b}
              onClick={() => setBoard(b)}
              className={`rounded-full px-3 py-1 font-medium capitalize transition-colors ${
                board === b
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {b === "sharp" ? "Sharp" : "ROI"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        {board === "sharp"
          ? "Ranked by a sharp score — closing-line value rolled up with return and volume, so it rewards beating the market, not just getting lucky."
          : "Ranked by return on stake. High variance can top this board a sharp score would not."}{" "}
        Players are shown by an opaque handle; nobody&apos;s account is on
        display.
      </p>

      {boardQuery.isLoading && (
        <p className="mt-6 text-sm text-muted" role="status">
          Loading the leaderboard…
        </p>
      )}

      {boardQuery.isError && (
        <QueryError
          message="The leaderboard is unavailable right now."
          onRetry={() => boardQuery.refetch()}
        />
      )}

      {boardQuery.data && boardQuery.data.entries.length === 0 && (
        <p className="mt-6 text-sm text-muted">
          {board === "sharp"
            ? "No sharp-ranked players yet — the Sharp board needs a minimum graded-bet volume before it ranks anyone. Try the ROI board."
            : "No ranked players yet — the board fills once bets are graded."}
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

type ProfileResult =
  | { signedOut: true }
  | {
      signedOut: false;
      stats: ProfileStats;
      wallets: ZeroproofWallet[];
      accolades: Accolade[];
    };

async function fetchProfile(): Promise<ProfileResult> {
  const res = await fetch("/api/zeroproof/me");
  if (res.status === 401) return { signedOut: true };
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const parsed = profileResponseSchema.parse(await res.json());
  return { signedOut: false, ...parsed };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-lg tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

const FORM_CHIP: Record<
  string,
  { letter: string; label: string; className: string }
> = {
  won: { letter: "W", label: "Win", className: "bg-success-500/15 text-success-600 dark:text-success-300" },
  lost: { letter: "L", label: "Loss", className: "bg-error-500/15 text-error-600 dark:text-error-300" },
  push: { letter: "P", label: "Push", className: "bg-surface-raised text-muted" },
  void: { letter: "V", label: "Void", className: "bg-surface-raised text-muted" },
};

/** The last handful of settled bets as W/L/P chips, newest first. */
function RecentForm({ bets }: { bets: ZeroproofBet[] }) {
  const form = recentForm(bets, 8);
  if (form.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">Recent form</h3>
      <ol
        className="mt-2 flex flex-wrap gap-1.5"
        aria-label="Recent settled bets, newest first"
      >
        {form.map(({ id, status }) => {
          const chip = FORM_CHIP[status] ?? FORM_CHIP.push;
          return (
            <li
              key={id}
              className={`flex h-7 w-7 items-center justify-center rounded-md font-mono text-xs font-semibold ${chip.className}`}
            >
              <span className="sr-only">{chip.label}</span>
              <span aria-hidden="true">{chip.letter}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function WalletCard({ wallet }: { wallet: ZeroproofWallet }) {
  return (
    <li className="rounded-xl border border-border bg-surface/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground capitalize">
          {wallet.mode}
        </span>
        <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted capitalize">
          {wallet.status}
        </span>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="font-mono text-2xl tabular-nums text-foreground">
          {formatCents(wallet.balanceCents)}
        </span>
        <span className="text-xs text-muted">
          of {formatCents(wallet.principalCents)} locked
        </span>
      </div>
    </li>
  );
}


/** Dollars typed by a person to positive integer cents, or null if not valid. */
function centsFromDollars(input: string): number | null {
  const n = Number.parseFloat(input);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function BetSlip({ bet, onClear }: { bet: SelectedBet; onClear: () => void }) {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: queryKeys.zeroproof.me(),
    queryFn: fetchProfile,
    staleTime: 60 * 1000,
    // Poll while signed in so a settlement lands here without a reload; stop
    // polling once we know there's no session, so a signed-out visitor isn't
    // re-asking every 30 seconds.
    refetchInterval: (query) =>
      query.state.data && !query.state.data.signedOut ? 30_000 : false,
  });
  const [stake, setStake] = useState("");
  const [walletId, setWalletId] = useState("");

  const signedOut = profileQuery.data?.signedOut ?? false;
  const wallets =
    profileQuery.data && !profileQuery.data.signedOut
      ? profileQuery.data.wallets
      : [];
  const activeWallet = walletId || wallets[0]?.id || "";
  const stakeCents = centsFromDollars(stake);

  const placeBet = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/zeroproof/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: activeWallet,
          eventId: bet.eventId,
          market: bet.market,
          selection: bet.selection,
          stakeCents,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          body?.error ?? "Couldn't place the bet — please try again.",
        );
      }
      return res.json();
    },
    // Optimistic: drop the bet onto its board fixture straight away, so placing
    // it feels instant rather than waiting on the round-trip. The settler's
    // real bet replaces it when onSettled refetches; a failure rolls it back.
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.zeroproof.bets() });
      const previous = queryClient.getQueryData<ZeroproofBet[]>(
        queryKeys.zeroproof.bets(),
      );
      const optimistic: ZeroproofBet = {
        id: `optimistic-${bet.eventId}-${bet.market}-${bet.selection}`,
        walletId: activeWallet,
        eventId: bet.eventId,
        market: bet.market,
        selection: bet.selection,
        oddsAmerican: bet.price,
        lineValue: bet.point ?? null,
        closingOddsAmerican: null,
        clv: null,
        stakeCents: stakeCents ?? 0,
        status: "open",
        placedAt: new Date().toISOString(),
        settledAt: null,
      };
      queryClient.setQueryData<ZeroproofBet[]>(
        queryKeys.zeroproof.bets(),
        (old) => [...(old ?? []), optimistic],
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.zeroproof.bets(), context.previous);
      }
    },
    onSuccess: () => {
      setStake("");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zeroproof.bets() });
      queryClient.invalidateQueries({ queryKey: queryKeys.zeroproof.me() });
    },
  });

  return (
    <div
      role="region"
      aria-label="Bet slip"
      className="mt-6 rounded-2xl border border-primary-500/40 bg-surface p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Bet slip</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-muted hover:text-foreground"
        >
          Clear
        </button>
      </div>
      <p className="mt-2 text-sm text-muted">{bet.eventLabel}</p>
      <p className="text-foreground">
        <span className="font-medium">{bet.selection}</span>{" "}
        {formatPoint(bet.point) && (
          <span className="text-muted">{formatPoint(bet.point)} </span>
        )}
        <span className="font-mono tabular-nums">{formatAmerican(bet.price)}</span>
      </p>

      {signedOut ? (
        <Link
          href="/auth/login"
          className="mt-4 inline-flex h-10 items-center rounded-full bg-primary-600 px-5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
        >
          Sign in to bet
        </Link>
      ) : wallets.length === 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted">Open a wallet to place this bet.</p>
          <OpenWalletActions />
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          {wallets.length > 1 && (
            <label className="text-xs text-muted">
              Wallet
              <select
                value={activeWallet}
                onChange={(e) => setWalletId(e.target.value)}
                className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.mode} — {formatCents(w.balanceCents)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-xs text-muted">
            Stake
            <input
              inputMode="decimal"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="$0.00"
              className="mt-1 block w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </label>
          <button
            type="button"
            onClick={() => placeBet.mutate()}
            disabled={stakeCents === null || placeBet.isPending}
            className="inline-flex h-10 items-center rounded-full bg-primary-600 px-5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none disabled:opacity-60"
          >
            {placeBet.isPending ? "Placing…" : "Place bet"}
          </button>
        </div>
      )}

      {placeBet.isSuccess && (
        <p className="mt-2 text-xs text-success-600 dark:text-success-300">
          Bet placed — your balance is updated below.
        </p>
      )}
    </div>
  );
}

async function fetchBets(): Promise<ZeroproofBet[]> {
  const res = await fetch("/api/zeroproof/bets");
  if (res.status === 401) return [];
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return betsResponseSchema.parse(await res.json()).bets;
}

function BetHistory() {
  const betsQuery = useQuery({
    queryKey: queryKeys.zeroproof.bets(),
    queryFn: fetchBets,
    staleTime: 30 * 1000,
    // Only mounts inside the signed-in profile, so a plain interval is safe:
    // a bet that grades server-side shows up here on the next poll.
    refetchInterval: 30_000,
  });

  if (!betsQuery.data || betsQuery.data.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">Recent bets</h3>
      <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
        {betsQuery.data.slice(0, 12).map((bet) => (
          <li
            key={bet.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-sm"
          >
            <span className="text-foreground">
              {bet.selection}{" "}
              <span className="text-muted">{marketLabel(bet.market)}</span>
            </span>
            <span className="flex items-center gap-3 font-mono tabular-nums">
              <span className="text-muted">{formatCents(bet.stakeCents)}</span>
              <span className="text-foreground">
                {formatAmerican(bet.oddsAmerican)}
              </span>
              {bet.clv !== null && (
                <span className="text-muted">CLV {formatSignedPct(bet.clv)}</span>
              )}
              <span
                className={`font-medium capitalize ${BET_STATUS_STYLE[bet.status] ?? "text-muted"}`}
              >
                {bet.status}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecordTrend({ wallets }: { wallets: ZeroproofWallet[] }) {
  const betsQuery = useQuery({
    queryKey: queryKeys.zeroproof.bets(),
    queryFn: fetchBets,
    staleTime: 30 * 1000,
  });
  const { overall, season } = bankrollTrend(betsQuery.data ?? [], wallets);
  // A line needs at least two points; skip until there's a trend to show.
  if (overall.length < 2) return null;

  const hasSeason =
    wallets.some((w) => w.mode === "season") && season.some((v) => v !== 0);
  const series = hasSeason
    ? [
        { label: "Overall", values: overall },
        { label: "Season", values: season },
      ]
    : [{ label: "Overall", values: overall }];
  const money = (value: number) =>
    `${value >= 0 ? "+" : "-"}$${Math.abs(value).toFixed(2)}`;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">Bankroll trend</h3>
      <p className="mt-1 text-xs text-muted">
        Cumulative profit and loss over your settled bets.
      </p>
      <div className="mt-3">
        <StackedLineChart
          label="Cumulative profit and loss over settled bets, season and overall"
          variant="lines"
          series={series}
        />
      </div>
      {/* The numbers in text, so the trend isn't colour-and-shape only. */}
      <p className="mt-2 text-xs text-muted">
        Overall {money(overall[overall.length - 1])}
        {hasSeason ? ` · Season ${money(season[season.length - 1])}` : ""} over{" "}
        {overall.length} settled bets.
      </p>
    </div>
  );
}

function Profile() {
  const profileQuery = useQuery({
    queryKey: queryKeys.zeroproof.me(),
    queryFn: fetchProfile,
    staleTime: 60 * 1000,
    // Poll while signed in so a settlement lands here without a reload; stop
    // polling once we know there's no session, so a signed-out visitor isn't
    // re-asking every 30 seconds.
    refetchInterval: (query) =>
      query.state.data && !query.state.data.signedOut ? 30_000 : false,
  });

  const signedIn = Boolean(
    profileQuery.data && !profileQuery.data.signedOut,
  );
  // Shares the bets cache with RecordTrend below (same query key); only fetches
  // once signed in, so a signed-out visitor never hits the 401.
  const betsQuery = useQuery({
    queryKey: queryKeys.zeroproof.bets(),
    queryFn: fetchBets,
    staleTime: 30 * 1000,
    enabled: signedIn,
  });
  const bets = betsQuery.data ?? [];

  return (
    <section aria-labelledby="profile-title" className="mt-12">
      <h2 id="profile-title" className="text-xl font-semibold text-foreground">
        Your record
      </h2>

      {profileQuery.isLoading && (
        <p className="mt-6 text-sm text-muted" role="status">
          Loading your profile…
        </p>
      )}

      {profileQuery.isError && (
        <QueryError
          message="Couldn't load your profile right now."
          onRetry={() => profileQuery.refetch()}
        />
      )}

      {profileQuery.data?.signedOut && (
        <div className="mt-4 rounded-2xl border border-border bg-surface/50 p-6">
          <p className="text-sm text-muted">
            Sign in to open a wallet, track your bets, and build a record you can
            show off.
          </p>
          <Link
            href="/auth/login"
            className="mt-4 inline-flex h-10 items-center rounded-full bg-primary-600 px-5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            Sign in
          </Link>
        </div>
      )}

      {profileQuery.data && !profileQuery.data.signedOut && (
        <div className="mt-6 space-y-6">
          <WinCelebration bets={bets} />

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Record" value={formatRecord(profileQuery.data.stats)} />
            <Stat
              label="Win rate"
              value={
                winRatePct(profileQuery.data.stats) === null
                  ? "—"
                  : `${winRatePct(profileQuery.data.stats)}%`
              }
            />
            <Stat
              label="ROI"
              value={formatSignedPct(profileQuery.data.stats.roiPct)}
            />
            <Stat label="Net profit" value={formatNetCents(netProfitTotalCents(bets))} />
            <Stat
              label="Sharp score"
              value={
                profileQuery.data.stats.sharpScore === null
                  ? "—"
                  : String(profileQuery.data.stats.sharpScore)
              }
            />
            <Stat
              label="Avg CLV"
              value={formatSignedPct(profileQuery.data.stats.clvAvgPct)}
            />
            <Stat
              label="Streak"
              value={formatStreak(profileQuery.data.stats.currentStreak)}
            />
            <Stat
              label="Best streak"
              value={`W${profileQuery.data.stats.longestStreak}`}
            />
            <Stat
              label="Biggest hit"
              value={formatCents(profileQuery.data.stats.biggestHitCents)}
            />
            <Stat
              label="Bets"
              value={String(profileQuery.data.stats.betCount)}
            />
          </dl>

          <RecentForm bets={bets} />

          <RecordTrend wallets={profileQuery.data.wallets} />

          {profileQuery.data.wallets.length > 0 ? (
            <div className="space-y-4">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {profileQuery.data.wallets.map((wallet) => (
                  <WalletCard key={wallet.id} wallet={wallet} />
                ))}
              </ul>
              <OpenWalletActions wallets={profileQuery.data.wallets} />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                No wallet open yet. Lock a simulated deposit to start betting the
                board — you get it back at term end whatever your record.
              </p>
              <OpenWalletActions />
            </div>
          )}

          {profileQuery.data.accolades.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Accolades">
              {profileQuery.data.accolades.map((accolade) => (
                <li
                  key={accolade.id}
                  className="rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1 text-xs text-primary-700 dark:text-primary-300"
                >
                  {accolade.name}
                </li>
              ))}
            </ul>
          )}

          <BetHistory />
        </div>
      )}
    </section>
  );
}

/**
 * How I stack up against the field: my stats next to a chosen leaderboard
 * player, and my own open bets alongside. Signed in only — it needs my record.
 */
function CompareTab() {
  const profileQuery = useQuery({
    queryKey: queryKeys.zeroproof.me(),
    queryFn: fetchProfile,
    staleTime: 60 * 1000,
  });
  const signedIn = Boolean(
    profileQuery.data && !profileQuery.data.signedOut,
  );
  const boardQuery = useQuery({
    queryKey: queryKeys.zeroproof.leaderboard("roi"),
    queryFn: () => getJson(`/api/zeroproof/leaderboard?board=roi`),
    select: (json) => leaderboardResponseSchema.parse(json),
    staleTime: 5 * 60 * 1000,
    enabled: signedIn,
  });
  const betsQuery = useQuery({
    queryKey: queryKeys.zeroproof.bets(),
    queryFn: fetchBets,
    staleTime: 30 * 1000,
    enabled: signedIn,
  });

  if (profileQuery.isLoading) {
    return (
      <p className="mt-12 text-sm text-muted" role="status">
        Loading your record…
      </p>
    );
  }
  if (profileQuery.isError) {
    return (
      <div className="mt-12">
        <QueryError
          message="Couldn't load your record right now."
          onRetry={() => profileQuery.refetch()}
        />
      </div>
    );
  }
  if (!profileQuery.data || profileQuery.data.signedOut) {
    return (
      <div className="mt-12 rounded-2xl border border-border bg-surface/50 p-6">
        <p className="text-sm text-muted">
          Sign in to compare your record against the rest of the board.
        </p>
        <Link
          href="/auth/login"
          className="mt-4 inline-flex h-10 items-center rounded-full bg-primary-600 px-5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <ComparePanel
      myStats={profileQuery.data.stats}
      entries={boardQuery.data?.entries ?? []}
      openBets={(betsQuery.data ?? []).filter((bet) => bet.status === "open")}
    />
  );
}

const LOBBY_TABS = [
  { id: "board", label: "Board" },
  { id: "leagues", label: "Leagues" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "compare", label: "Compare" },
  { id: "record", label: "Your record" },
] as const;
type LobbyTab = (typeof LOBBY_TABS)[number]["id"];

/**
 * The public face of ZeroProof, split into tabs so the three things you might be
 * doing stay separate: the live board (and bet slip), the leaderboard, and your
 * own record. All three panels stay mounted so their data preloads and a tab
 * switch is instant; inactive ones are `hidden`, which also keeps them out of
 * the accessibility tree.
 */
export default function ZeroProofContent() {
  const [selectedBet, setSelectedBet] = useState<SelectedBet | null>(null);
  const [tab, setTab] = useState<LobbyTab>("board");
  const tabRefs = useRef<Partial<Record<LobbyTab, HTMLButtonElement | null>>>({});

  // The first-run tour, built on the shared engine. Each coach-mark switches to
  // the tab it describes so its panel shows behind the highlight.
  const tourSteps: TourStep[] = [
    {
      title: "Take a quick tour?",
      body: "New to ZeroProof? I'll walk you through what it is and how to use it — a few clicks, no commitment.",
    },
    {
      anchor: "zp-intro",
      title: "Betting, with the loss removed",
      body: "Lock a simulated deposit, bet real lines, get the deposit back at term end whatever your record — and the record is yours to keep.",
    },
    {
      anchor: "zp-tab-board",
      onEnter: () => setTab("board"),
      title: "The board",
      body: "Browse upcoming games and their live lines. Tap an outcome and it drops onto your bet slip.",
    },
    {
      anchor: "zp-tab-leagues",
      onEnter: () => setTab("leagues"),
      title: "Leagues",
      body: "Start your own contest — create a league, set the rules, and invite friends to a private leaderboard.",
    },
    {
      anchor: "zp-tab-leaderboard",
      onEnter: () => setTab("leaderboard"),
      title: "The leaderboard",
      body: "See who's sharpest — ranked by a sharp score that rewards beating the market, or by raw ROI.",
    },
    {
      anchor: "zp-tab-record",
      onEnter: () => setTab("record"),
      title: "Your record",
      body: "Open a wallet, place bets, and watch your bankroll trend build — a record you can show off.",
    },
  ];

  const focusTab = (id: LobbyTab) => {
    setTab(id);
    tabRefs.current[id]?.focus();
  };
  const onTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const index = LOBBY_TABS.findIndex((t) => t.id === tab);
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTab(LOBBY_TABS[(index + 1) % LOBBY_TABS.length].id);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTab(LOBBY_TABS[(index - 1 + LOBBY_TABS.length) % LOBBY_TABS.length].id);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(LOBBY_TABS[0].id);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(LOBBY_TABS[LOBBY_TABS.length - 1].id);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header id="zp-intro" className="flex flex-wrap items-start justify-between gap-3">
        <div>
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
        </div>
        <div className="flex items-center gap-2">
          <AdminBetsLink />
          <FeatureTour
            label="ZeroProof"
            storageKey="zeroproof-tour-seen"
            steps={tourSteps}
          />
        </div>
      </header>

      <div
        role="tablist"
        aria-label="ZeroProof sections"
        className="mt-8 flex gap-1 border-b border-border"
      >
        {LOBBY_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(element) => {
                tabRefs.current[t.id] = element;
              }}
              type="button"
              role="tab"
              id={`zp-tab-${t.id}`}
              aria-selected={active}
              aria-controls={`zp-panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={onTabKeyDown}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none ${
                active
                  ? "border-primary-600 text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="zp-panel-board"
        aria-labelledby="zp-tab-board"
        tabIndex={0}
        hidden={tab !== "board"}
        className="focus-visible:outline-none"
      >
        {selectedBet && (
          <BetSlip bet={selectedBet} onClear={() => setSelectedBet(null)} />
        )}
        <Slate selected={selectedBet} onPick={setSelectedBet} />
      </div>
      <div
        role="tabpanel"
        id="zp-panel-leagues"
        aria-labelledby="zp-tab-leagues"
        tabIndex={0}
        hidden={tab !== "leagues"}
        className="focus-visible:outline-none"
      >
        <LeaguesPanel />
      </div>
      <div
        role="tabpanel"
        id="zp-panel-leaderboard"
        aria-labelledby="zp-tab-leaderboard"
        tabIndex={0}
        hidden={tab !== "leaderboard"}
        className="focus-visible:outline-none"
      >
        <Leaderboard />
      </div>
      <div
        role="tabpanel"
        id="zp-panel-compare"
        aria-labelledby="zp-tab-compare"
        tabIndex={0}
        hidden={tab !== "compare"}
        className="focus-visible:outline-none"
      >
        <CompareTab />
      </div>
      <div
        role="tabpanel"
        id="zp-panel-record"
        aria-labelledby="zp-tab-record"
        tabIndex={0}
        hidden={tab !== "record"}
        className="focus-visible:outline-none"
      >
        <Profile />
      </div>
    </div>
  );
}
