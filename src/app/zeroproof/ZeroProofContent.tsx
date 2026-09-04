"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
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
  formatPoint,
  formatRecord,
  formatSignedPct,
  formatStreak,
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

function EventCard({
  event,
  selected,
  onPick,
}: {
  event: ZeroproofEvent;
  selected: SelectedBet | null;
  onPick: (bet: SelectedBet) => void;
}) {
  const label = `${event.away} @ ${event.home}`;
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
                {market.outcomes.map((outcome) => {
                  const isSelected =
                    selected !== null &&
                    selected.eventId === event.id &&
                    selected.market === market.market &&
                    selected.selection === outcome.name;
                  return (
                    <OutcomeButton
                      key={`${outcome.name}-${outcome.point ?? ""}`}
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

function Slate({
  selected,
  onPick,
}: {
  selected: SelectedBet | null;
  onPick: (bet: SelectedBet) => void;
}) {
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
            <EventCard
              key={event.id}
              event={event}
              selected={selected}
              onPick={onPick}
            />
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
  const [board, setBoard] = useState<"sharp" | "roi">("sharp");
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

function useOpenWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mode: "season" | "challenge") => {
      // A Season wallet needs a deposit ($20 minimum on the backend); default to
      // $500 to match the lobby wireframe until a deposit-amount input lands.
      // Challenge is a fixed $100, so it sends no amount.
      const body =
        mode === "season" ? { mode, depositCents: 50_000 } : { mode };
      const res = await fetch("/api/zeroproof/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `Couldn't open a wallet (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.zeroproof.me() }),
  });
}

const openWalletButton =
  "inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-sm text-foreground transition-colors hover:border-primary-500/50 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none disabled:opacity-60";

function OpenWalletActions() {
  const open = useOpenWallet();
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => open.mutate("season")}
          disabled={open.isPending}
          className={openWalletButton}
        >
          Open a Season wallet
        </button>
        <button
          type="button"
          onClick={() => open.mutate("challenge")}
          disabled={open.isPending}
          className={openWalletButton}
        >
          Open a Challenge wallet
        </button>
      </div>
      {open.isError && (
        <p className="mt-2 text-xs text-error-600 dark:text-error-300">
          {(open.error as Error).message}
        </p>
      )}
    </div>
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
        throw new Error(body?.error ?? `Couldn't place the bet (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zeroproof.me() });
      setStake("");
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

      {placeBet.isError && (
        <p className="mt-2 text-xs text-error-600 dark:text-error-300">
          {(placeBet.error as Error).message}
        </p>
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

const BET_STATUS_STYLE: Record<string, string> = {
  won: "text-success-600 dark:text-success-300",
  lost: "text-error-600 dark:text-error-300",
  open: "text-primary-700 dark:text-primary-300",
  push: "text-muted",
  void: "text-muted",
};

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
        <p className="mt-6 text-sm text-error-600 dark:text-error-300">
          Couldn&apos;t load your profile right now.
        </p>
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
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Record" value={formatRecord(profileQuery.data.stats)} />
            <Stat
              label="ROI"
              value={formatSignedPct(profileQuery.data.stats.roiPct)}
            />
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

          {profileQuery.data.wallets.length > 0 ? (
            <div className="space-y-4">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {profileQuery.data.wallets.map((wallet) => (
                  <WalletCard key={wallet.id} wallet={wallet} />
                ))}
              </ul>
              <OpenWalletActions />
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
 * The public face of ZeroProof. The board is live, the profile and bet slip are
 * gated on a signed-in wallet: picking an outcome fills the slip, and the slip
 * places against the same slate the settler grades.
 */
export default function ZeroProofContent() {
  const [selectedBet, setSelectedBet] = useState<SelectedBet | null>(null);

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

      {selectedBet && (
        <BetSlip bet={selectedBet} onClear={() => setSelectedBet(null)} />
      )}
      <Profile />
      <Slate selected={selectedBet} onPick={setSelectedBet} />
      <Leaderboard />
    </div>
  );
}
