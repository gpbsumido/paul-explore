"use client";

import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

const ACCENT = "var(--wp-accent, #60a5fa)";

type Tab = "Overview" | "NFTs" | "Transactions";
const TABS: Tab[] = ["Overview", "NFTs", "Transactions"];

const SAMPLES = ["0xA1B2…4f9c", "0x77Ce…10ab", "0x0d3F…c2e1"];

/** Build a deterministic fake wallet from an address string. */
function walletFor(addr: string) {
  const rng = makeRng(
    addr.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) || 1,
  );
  const nftCount = roundish(rng() * 12);
  const txCount = roundish(2 + rng() * 20);
  const nfts = Array.from({ length: nftCount }, (_, i) => ({
    id: i,
    name: `Item #${roundish(rng() * 9999)}`,
    rarity: ["Common", "Rare", "Epic", "Legendary"][roundish(rng() * 3)],
    hue: roundish(rng() * 360),
  }));
  const txns = Array.from({ length: txCount }, (_, i) => ({
    id: i,
    kind: rng() > 0.5 ? "Send" : "Receive",
    amount: (rng() * 5).toFixed(3),
    ago: `${roundish(1 + rng() * 60)}m ago`,
  }));
  return {
    balance: (rng() * 40).toFixed(2),
    tokens: roundish(2 + rng() * 8),
    nftCount,
    txCount,
    firstSeen: `${2020 + roundish(rng() * 4)}`,
    nfts,
    txns,
  };
}

const RARITY_TINT: Record<string, string> = {
  Common: "#94a3b8",
  Rare: "#60a5fa",
  Epic: "#c084fc",
  Legendary: "#f59e0b",
};

/**
 * Flagship demo for portal v2's wallet lookup. Enter an address, get an
 * overview; the NFTs and Transactions tabs land in the next commit. Data is
 * a deterministic fake keyed off the address, no chain calls.
 */
export default function WalletLookupDemo({ feature }: { feature: WorkFeature }) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(false);

  // Overview is instant; the data-heavy tabs show a brief loading state,
  // like the original waiting on the chain-data API. The loading flag is set
  // when the tab is chosen (below), the effect only clears it on a timer.
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [loading]);

  const submit = (addr: string) => {
    const trimmed = addr.trim();
    if (!trimmed) return;
    setAddress(trimmed);
    setTab("Overview");
  };

  const pickTab = (t: Tab) => {
    setTab(t);
    if (t !== "Overview") setLoading(true);
  };

  const wallet = address ? walletFor(address) : null;

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex gap-2"
      >
        <Input
          label="Wallet address"
          hideLabel
          size="sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="paste a wallet address"
          className="min-w-0 flex-1"
        />
        <button
          type="submit"
          className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
          style={{ backgroundColor: ACCENT }}
        >
          Look up
        </button>
      </form>

      {!address && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-[12px] text-muted">try a sample address</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {SAMPLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setInput(s);
                  submit(s);
                }}
                className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-foreground hover:bg-black/5 dark:hover:bg-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {address && wallet && (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <p className="font-mono text-[11px] text-muted">{address}</p>
          <div role="tablist" className="flex gap-1 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => pickTab(t)}
                className={`-mb-px border-b-2 px-3 py-1.5 text-[12px] ${
                  tab === t ? "border-current text-foreground" : "border-transparent text-muted"
                }`}
                style={tab === t ? { color: ACCENT } : undefined}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === "Overview" && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Balance", `${wallet.balance} ETH`],
                  ["Tokens", `${wallet.tokens}`],
                  ["NFTs", `${wallet.nftCount}`],
                  ["First seen", wallet.firstSeen],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-border p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      {label}
                    </p>
                    <p className="text-sm font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            )}
            {tab !== "Overview" && loading && (
              <div
                aria-label="Loading"
                className="grid grid-cols-3 gap-2 sm:grid-cols-4"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-black/5 dark:bg-white/10"
                  />
                ))}
              </div>
            )}

            {tab === "NFTs" && !loading &&
              (wallet.nfts.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-muted">
                  this wallet holds no NFTs
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {wallet.nfts.map((nft) => (
                    <div
                      key={nft.id}
                      className="overflow-hidden rounded-lg border border-border"
                    >
                      <div
                        className="h-12"
                        style={{ backgroundColor: `hsl(${nft.hue} 60% 55%)` }}
                      />
                      <div className="p-1.5">
                        <p className="truncate text-[10px] font-medium text-foreground">
                          {nft.name}
                        </p>
                        <p
                          className="text-[9px] font-semibold"
                          style={{ color: RARITY_TINT[nft.rarity] }}
                        >
                          {nft.rarity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {tab === "Transactions" && !loading && (
              <ul className="divide-y divide-border text-[12px]">
                {wallet.txns.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between py-1.5">
                    <span
                      className={
                        tx.kind === "Receive" ? "text-emerald-500" : "text-foreground"
                      }
                    >
                      {tx.kind}
                    </span>
                    <span className="font-mono text-foreground">{tx.amount} ETH</span>
                    <span className="text-muted">{tx.ago}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
