"use client";

import { useState } from "react";
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
  return {
    balance: (rng() * 40).toFixed(2),
    tokens: roundish(2 + rng() * 8),
    nftCount: roundish(rng() * 12),
    txCount: roundish(rng() * 200),
    firstSeen: `${2020 + roundish(rng() * 4)}`,
  };
}

/**
 * Flagship demo for portal v2's wallet lookup. Enter an address, get an
 * overview; the NFTs and Transactions tabs land in the next commit. Data is
 * a deterministic fake keyed off the address, no chain calls.
 */
export default function WalletLookupDemo({ feature }: { feature: WorkFeature }) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");

  const submit = (addr: string) => {
    const trimmed = addr.trim();
    if (!trimmed) return;
    setAddress(trimmed);
    setTab("Overview");
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
        <input
          aria-label="Wallet address"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="paste a wallet address"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-[12px] text-foreground"
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
                onClick={() => setTab(t)}
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
            {tab !== "Overview" && (
              <p className="py-8 text-center text-[12px] text-muted">
                {tab} view coming in the next commit
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
