"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { PACK_COST, type GeneratedCard, type Sport } from "@/lib/fantasy-cards";
import PackOpener from "./PackOpener";

/** The slate the user is looking at, so a rip draws from the same pool. */
export type RipSlate = {
  sport: Sport;
  mode: "nightly" | "season";
  date?: string | null;
  week?: number | null;
};

type Wallet = { balance: number; lastClaimDate: string | null } | null;

async function getWallet(): Promise<Wallet> {
  const res = await fetch("/api/card-lab/wallet");
  if (res.status === 401) return null; // guest
  if (!res.ok) throw new Error("Could not load your wallet");
  return res.json();
}

/** Coin balance, daily claim, and pack ripping from the current slate. */
export default function PackBar({ slate }: { slate: RipSlate }) {
  const qc = useQueryClient();
  const [revealed, setRevealed] = useState<GeneratedCard[] | null>(null);

  const wallet = useQuery({ queryKey: queryKeys.cardLab.wallet(), queryFn: getWallet });

  const claim = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/card-lab/wallet/claim", { method: "POST" });
      if (!res.ok) throw new Error("Could not claim");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cardLab.wallet() }),
  });

  const rip = useMutation({
    mutationFn: async (): Promise<{ cards: GeneratedCard[]; balance: number }> => {
      const res = await fetch("/api/card-lab/packs/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: slate.sport,
          mode: slate.mode,
          date: slate.date ?? undefined,
          week: slate.week ?? undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (res.status === 402) throw new Error("Not enough coins — claim your daily first.");
        if (res.status === 409) throw new Error(body?.error ?? "No cards on this slate to rip.");
        throw new Error(
          body?.error ? `${body.error} (${res.status})` : `Couldn't open a pack (${res.status}).`,
        );
      }
      return res.json();
    },
    onSuccess: (data) => {
      setRevealed(data.cards);
      qc.invalidateQueries({ queryKey: queryKeys.cardLab.wallet() });
      qc.invalidateQueries({ queryKey: queryKeys.cardLab.collection() });
    },
  });

  if (wallet.isLoading) return null;

  // Only a real 401 (queryFn returns null) means "guest". A thrown error means
  // the wallet API is unreachable — don't tell a signed-in user to sign in.
  if (wallet.data === null) {
    return (
      <section
        aria-label="Packs"
        className="mb-6 rounded-xl border border-border bg-surface px-4 py-3 text-[14px] text-muted"
      >
        <a href="/auth/login" className="font-semibold text-foreground underline">
          Sign in
        </a>{" "}
        to earn coins and rip packs of these cards.
      </section>
    );
  }

  if (!wallet.data) {
    return wallet.isError ? (
      <section
        aria-label="Packs"
        className="mb-6 rounded-xl border border-border bg-surface px-4 py-3 text-[14px] text-muted"
      >
        Packs are unavailable right now.
      </section>
    ) : null;
  }

  const { balance } = wallet.data;
  const canRip = balance >= PACK_COST;

  return (
    <section
      aria-label="Packs"
      className="mb-6 rounded-xl border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[15px] font-semibold text-foreground">
          <span className="tabular-nums">{balance}</span> coins
        </span>
        <button
          type="button"
          onClick={() => claim.mutate()}
          disabled={claim.isPending}
          className="rounded-full border border-border px-3 py-1 text-[13px] font-medium text-foreground hover:border-foreground/40 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        >
          {claim.isPending ? "Claiming…" : "Claim daily"}
        </button>
        <button
          type="button"
          onClick={() => rip.mutate()}
          disabled={!canRip || rip.isPending}
          className="rounded-full border border-foreground bg-foreground px-3 py-1 text-[13px] font-semibold text-background disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        >
          {rip.isPending ? "Ripping…" : `Rip a pack (${PACK_COST})`}
        </button>
        <a
          href="/fantasy/nba/cards/collection"
          className="text-[13px] text-muted underline hover:text-foreground"
        >
          Collection
        </a>
      </div>

      {rip.isError ? (
        <p role="alert" className="mt-2 text-[13px] text-muted">
          {(rip.error as Error).message}
        </p>
      ) : null}

      {revealed ? (
        <PackOpener cards={revealed} onClose={() => setRevealed(null)} />
      ) : null}
    </section>
  );
}
