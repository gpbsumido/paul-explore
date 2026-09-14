"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  type ZeroproofAdminBet,
  adminBetsResponseSchema,
} from "@/lib/zeroproof/schemas";
import {
  formatAmerican,
  formatCents,
  formatRecord,
  marketLabel,
  playerHandle,
} from "@/lib/zeroproof/format";
import AdminBackLink from "../AdminBackLink";

async function fetchAdminBets(q: string): Promise<ZeroproofAdminBet[]> {
  const suffix = q ? `?q=${encodeURIComponent(q)}` : "";
  const res = await fetch(`/api/zeroproof/admin/bets${suffix}`);
  if (!res.ok) throw new Error(`Couldn't load bets (${res.status})`);
  return adminBetsResponseSchema.parse(await res.json()).bets;
}

type StatusView = "all" | "live" | "resolved";

const controlClass =
  "h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none";
const primaryButtonClass =
  "inline-flex h-9 items-center rounded-full bg-primary-600 px-4 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none disabled:opacity-60";

/** A bet is live while it's open; anything settled (won/lost/push/void) is resolved. */
function isLive(bet: ZeroproofAdminBet): boolean {
  return bet.status === "open";
}

/** Who placed a bet: the handle, then the email, then a stable opaque token. */
function bettorName(bet: Pick<ZeroproofAdminBet, "handle" | "email" | "userSub">): string {
  return bet.handle ?? bet.email ?? playerHandle(bet.userSub);
}

/** Short calendar date, or an em dash when a bet hasn't settled yet. */
function shortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const STATUS_STYLE: Record<string, string> = {
  open: "text-primary-600 dark:text-primary-300",
  won: "text-success-600 dark:text-success-300",
  lost: "text-error-600 dark:text-error-300",
  push: "text-muted",
  void: "text-muted",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`font-medium capitalize ${STATUS_STYLE[status] ?? "text-foreground"}`}>
      {status}
    </span>
  );
}

/** One row per player: their record over every bet, plus how many are still live. */
function PlayerRecords({ bets }: { bets: ZeroproofAdminBet[] }) {
  const rows = useMemo(() => {
    const groups = new Map<string, ZeroproofAdminBet[]>();
    for (const bet of bets) {
      groups.set(bet.userSub, [...(groups.get(bet.userSub) ?? []), bet]);
    }
    return [...groups.entries()]
      .map(([userSub, list]) => {
        const count = (status: string) => list.filter((b) => b.status === status).length;
        return {
          userSub,
          name: bettorName(list[0]),
          email: list[0].email,
          wins: count("won"),
          losses: count("lost"),
          pushes: count("push"),
          live: list.filter(isLive).length,
          total: list.length,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [bets]);

  if (rows.length === 0) return null;

  return (
    <table className="mt-3 w-full text-sm" aria-label="Player records">
      <thead>
        <tr className="text-left text-xs text-muted">
          <th scope="col" className="py-2 pr-3 font-medium">Player</th>
          <th scope="col" className="py-2 pr-3 font-medium">Record (W-L-P)</th>
          <th scope="col" className="py-2 pr-3 font-medium">Bets</th>
          <th scope="col" className="py-2 font-medium">Live</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.userSub} className="border-t border-border text-foreground">
            <td className="py-2 pr-3">
              <span className="font-medium">{row.name}</span>
              {row.email && row.email !== row.name && (
                <span className="ml-2 text-xs text-muted">{row.email}</span>
              )}
            </td>
            <td className="py-2 pr-3 tabular-nums">{formatRecord(row)}</td>
            <td className="py-2 pr-3 tabular-nums">{row.total}</td>
            <td className="py-2 tabular-nums">{row.live}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The full bet ledger across every player, filtered by the live/resolved view. */
function BetsTable({ bets, view }: { bets: ZeroproofAdminBet[]; view: StatusView }) {
  const rows = useMemo(() => {
    if (view === "live") return bets.filter(isLive);
    if (view === "resolved") return bets.filter((b) => !isLive(b));
    return bets;
  }, [bets, view]);

  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-muted">No bets match this view yet.</p>;
  }

  return (
    <table className="mt-3 w-full text-sm" aria-label="All bets">
      <thead>
        <tr className="text-left text-xs text-muted">
          <th scope="col" className="py-2 pr-3 font-medium">Player</th>
          <th scope="col" className="py-2 pr-3 font-medium">Selection</th>
          <th scope="col" className="py-2 pr-3 font-medium">Market</th>
          <th scope="col" className="py-2 pr-3 font-medium">Odds</th>
          <th scope="col" className="py-2 pr-3 font-medium">Stake</th>
          <th scope="col" className="py-2 pr-3 font-medium">Mode</th>
          <th scope="col" className="py-2 pr-3 font-medium">Status</th>
          <th scope="col" className="py-2 pr-3 font-medium">Placed</th>
          <th scope="col" className="py-2 font-medium">Settled</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((bet) => (
          <tr key={bet.id} className="border-t border-border text-foreground">
            <td className="py-2 pr-3">{bettorName(bet)}</td>
            <td className="py-2 pr-3">{bet.selection}</td>
            <td className="py-2 pr-3 text-muted">{marketLabel(bet.market)}</td>
            <td className="py-2 pr-3 tabular-nums">{formatAmerican(bet.oddsAmerican)}</td>
            <td className="py-2 pr-3 tabular-nums">{formatCents(bet.stakeCents)}</td>
            <td className="py-2 pr-3 capitalize text-muted">{bet.mode}</td>
            <td className="py-2 pr-3"><StatusPill status={bet.status} /></td>
            <td className="py-2 pr-3 text-muted">{shortDate(bet.placedAt)}</td>
            <td className="py-2 text-muted">{shortDate(bet.settledAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const VIEWS: { key: StatusView; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "resolved", label: "Resolved" },
];

export default function AdminBetsContent() {
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [view, setView] = useState<StatusView>("all");

  const query = useQuery({
    queryKey: queryKeys.zeroproof.adminBets(submitted),
    queryFn: () => fetchAdminBets(submitted),
  });

  const bets = query.data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AdminBackLink current="Bets" />
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Bets</h1>
        <p className="mt-1 text-sm text-muted">
          Every player&apos;s ZeroProof bets and records, live and resolved. The public
          leaderboard stays anonymous; this admin view is the one place that names names.
        </p>
      </header>

      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(search.trim());
        }}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="admin-bets-search" className="text-xs text-muted">
            Search by player, selection or market
          </label>
          <input
            id="admin-bets-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="greg@example.com, Celtics, spread…"
            className={`${controlClass} w-72`}
          />
        </div>
        <button type="submit" className={primaryButtonClass}>
          Search
        </button>
      </form>

      {query.isLoading ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : query.isError ? (
        <p className="mt-8 text-sm text-error-600 dark:text-error-300">
          {(query.error as Error).message}
        </p>
      ) : bets.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          {submitted ? `No bets match "${submitted}".` : "No bets placed yet."}
        </p>
      ) : (
        <>
          <section aria-labelledby="records-title" className="mt-8">
            <h2
              id="records-title"
              className="text-sm font-semibold tracking-wide text-muted uppercase"
            >
              Player records
            </h2>
            <PlayerRecords bets={bets} />
          </section>

          <section aria-labelledby="bets-title" className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="bets-title"
                className="text-sm font-semibold tracking-wide text-muted uppercase"
              >
                All bets
              </h2>
              <div className="flex gap-1" role="group" aria-label="Filter bets by status">
                {VIEWS.map((v) => {
                  const active = view === v.key;
                  return (
                    <button
                      key={v.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setView(v.key)}
                      className={`h-8 rounded-full px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none ${
                        active
                          ? "bg-primary-600 text-white"
                          : "border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <BetsTable bets={bets} view={view} />
          </section>
        </>
      )}
    </div>
  );
}
