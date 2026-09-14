"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { ZeroproofWallet } from "@/lib/zeroproof/schemas";

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
        const err = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          err?.error ?? "Couldn't open the wallet — please try again.",
        );
      }
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.zeroproof.me() }),
  });
}

const openWalletButton =
  "inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-sm text-foreground transition-colors hover:border-primary-500/50 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none disabled:opacity-60 disabled:hover:border-border disabled:hover:bg-surface";

/** One explainer card: what a mode lets you do, gives you, and limits. */
function WalletExplainer({
  name,
  tagline,
  can,
  get,
  limits,
}: {
  name: string;
  tagline: string;
  can: string;
  get: string;
  limits: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-foreground">{name}</h3>
      <p className="mt-1 text-xs text-muted">{tagline}</p>
      <dl className="mt-2 space-y-1 text-xs">
        <div>
          <dt className="inline font-medium text-foreground">Do: </dt>
          <dd className="inline text-muted">{can}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Get: </dt>
          <dd className="inline text-muted">{get}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Limits: </dt>
          <dd className="inline text-muted">{limits}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * The open-a-wallet controls, with an explainer so nobody commits blind. The
 * backend allows one active wallet per mode, so a button for a mode you already
 * hold is disabled rather than left to 409 on click.
 */
export default function OpenWalletActions({
  wallets = [],
}: {
  wallets?: ZeroproofWallet[];
}) {
  const open = useOpenWallet();
  const hasActiveSeason = wallets.some(
    (w) => w.mode === "season" && w.status === "active",
  );
  const hasActiveChallenge = wallets.some(
    (w) => w.mode === "challenge" && w.status === "active",
  );

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <WalletExplainer
          name="Season"
          tagline="Your bankroll for the term."
          can="Open one and bet the live board all term — no deposit needed; it starts you with a simulated $500 to play."
          get="That $500 back at term end — three months out, whatever your record."
          limits="One active Season wallet at a time; it can't bust. Choosing your own deposit amount is coming; for now the $500 is fixed and simulated."
        />
        <WalletExplainer
          name="Challenge"
          tagline="A fixed $100 sprint — everyone starts equal."
          can="Grow the same $100 as high as you can against the live board."
          get="Milestone badges as it climbs — $250, $500, First $1k, $5k, and $1k in 14 days."
          limits="One active at a time; hit $0 and it busts and is archived (betting stops). The $100 still refunds at term end."
        />
      </div>
      <p className="mt-3 text-xs text-muted">
        Both use simulated money on a real double-entry ledger, lock for a
        three-month term, and count toward the global leaderboard.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => open.mutate("season")}
          disabled={open.isPending || hasActiveSeason}
          title={
            hasActiveSeason
              ? "You already have an active season wallet"
              : undefined
          }
          className={openWalletButton}
        >
          Open a Season wallet
        </button>
        <button
          type="button"
          onClick={() => open.mutate("challenge")}
          disabled={open.isPending || hasActiveChallenge}
          title={
            hasActiveChallenge
              ? "You already have an active challenge wallet"
              : undefined
          }
          className={openWalletButton}
        >
          Open a Challenge wallet
        </button>
      </div>

      {(hasActiveSeason || hasActiveChallenge) && (
        <p className="mt-2 text-xs text-muted">
          {hasActiveSeason && hasActiveChallenge
            ? "You already have an active season and challenge wallet."
            : hasActiveSeason
              ? "You already have an active season wallet."
              : "You already have an active challenge wallet."}
        </p>
      )}
    </div>
  );
}
