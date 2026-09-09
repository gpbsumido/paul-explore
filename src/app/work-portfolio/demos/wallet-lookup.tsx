"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
} from "recharts";
import Input from "@/components/ui/Input";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";
import { ChartTooltip } from "./_shared/ChartTooltip";

const ACCENT = "var(--wp-accent, #4a83c8)";

type Tab = "Overview" | "NFTs" | "Transactions";
const TABS: Tab[] = ["Overview", "NFTs", "Transactions"];

const SAMPLES = ["0xA1B2…4f9c", "0x77Ce…10ab", "0x0d3F…c2e1"];

const TOKEN_POOL = [
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "MATIC", name: "Polygon" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "UNI", name: "Uniswap" },
  { symbol: "ARB", name: "Arbitrum" },
  { symbol: "AAVE", name: "Aave" },
];

/** Build a deterministic fake wallet from an address string. */
function walletFor(addr: string) {
  const rng = makeRng(
    addr.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) || 1,
  );
  const nftCount = roundish(rng() * 12);
  const txCount = roundish(2 + rng() * 20);
  const balance = Number((rng() * 40).toFixed(2));

  // A holdings breakdown that sums to the net worth, so the bars read as real.
  const held = 3 + roundish(rng() * 3);
  const rawTokens = TOKEN_POOL.slice(0, held).map((t) => ({
    ...t,
    usd: roundish(50 + rng() * 4000),
    amount: Number((rng() * 900).toFixed(2)),
  }));
  const tokensUsd = rawTokens.reduce((s, t) => s + t.usd, 0);
  const tokens = rawTokens
    .map((t) => ({ ...t, pct: Math.round((t.usd / tokensUsd) * 100) }))
    .sort((a, b) => b.usd - a.usd);
  const usdValue = tokensUsd;

  // A 24-point balance history for the sparkline, drifting around the balance.
  let running = balance * (0.7 + rng() * 0.3);
  const history = Array.from({ length: 24 }, (_, i) => {
    running = Math.max(0.2, running + (rng() - 0.45) * balance * 0.12);
    return { h: i, v: Number(running.toFixed(2)) };
  });
  const change24h = Number(
    (((history[23].v - history[0].v) / history[0].v) * 100).toFixed(1),
  );

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
    balance,
    usdValue,
    change24h,
    tokens,
    history,
    tokenCount: tokens.length,
    nftCount,
    txCount,
    firstSeen: `${2020 + roundish(rng() * 4)}`,
    nfts,
    txns,
  };
}

const RARITY_TINT: Record<string, string> = {
  Common: "#a49d90",
  Rare: "#4a83c8",
  Epic: "#8f52cb",
  Legendary: "#bd8d3a",
};

function usd(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/**
 * Flagship demo for portal v2's wallet lookup. Enter an address and it reads
 * like a real explorer: net worth with 24h drift, a balance sparkline, the
 * token holdings breakdown, plus NFTs and transactions. Data is a deterministic
 * fake keyed off the address — no chain calls.
 */
export default function WalletLookupDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(false);

  // Overview is instant; the data-heavy tabs show a brief loading state,
  // like the original waiting on the chain-data API.
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
  const up = (wallet?.change24h ?? 0) >= 0;

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">
        {feature.title}
      </p>

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
                className="paul-touch-min rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-foreground hover:bg-black/5 dark:hover:bg-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {address && wallet && (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {/* Net-worth header: the number you'd look for first, with 24h drift. */}
          <div className="flex flex-wrap items-end justify-between gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2">
            <div>
              <p className="font-mono text-[11px] text-muted">{address}</p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {usd(wallet.usdValue)}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                  up
                    ? "bg-success-500/15 text-success-600 dark:text-success-300"
                    : "bg-error-500/15 text-error-600 dark:text-error-300"
                }`}
              >
                {up ? "▲" : "▼"} {Math.abs(wallet.change24h)}% · 24h
              </span>
              <p className="mt-0.5 text-[11px] text-muted tabular-nums">
                {wallet.balance} ETH
              </p>
            </div>
          </div>

          <div role="tablist" className="flex gap-1 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => pickTab(t)}
                className={`-mb-px border-b-2 px-3 py-1.5 text-[12px] ${
                  tab === t
                    ? "border-current text-foreground"
                    : "border-transparent text-muted"
                }`}
                style={tab === t ? { color: ACCENT } : undefined}
              >
                {t}
                {t === "NFTs" && (
                  <span className="ml-1 text-[10px] text-muted">
                    {wallet.nftCount}
                  </span>
                )}
                {t === "Transactions" && (
                  <span className="ml-1 text-[10px] text-muted">
                    {wallet.txCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === "Overview" && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Tokens", `${wallet.tokenCount}`],
                    ["NFTs", `${wallet.nftCount}`],
                    ["Transactions", `${wallet.txCount}`],
                    ["First seen", wallet.firstSeen],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-border p-2.5"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-muted">
                        {label}
                      </p>
                      <p className="text-sm font-bold text-foreground tabular-nums">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Balance over the last 24h — a real explorer always has this. */}
                <div className="rounded-lg border border-border p-2.5">
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted">
                    Balance · 24h
                  </p>
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={wallet.history}
                        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                      >
                        <XAxis dataKey="h" hide />
                        <Tooltip
                          content={<ChartTooltip accent="#4a83c8" formatValue={(v) => `${v} ETH`} />}
                          cursor={{ stroke: "#4a83c8", strokeOpacity: 0.25 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke="#4a83c8"
                          fill="#4a83c8"
                          fillOpacity={0.18}
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Token holdings with share-of-portfolio bars. */}
                <div className="rounded-lg border border-border p-2.5">
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted">
                    Token holdings
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {wallet.tokens.map((t) => (
                      <li key={t.symbol} className="flex items-center gap-2">
                        <span className="w-12 shrink-0 font-mono text-[11px] font-semibold text-foreground">
                          {t.symbol}
                        </span>
                        <span className="hidden w-24 shrink-0 truncate text-[11px] text-muted sm:block">
                          {t.name}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${t.pct}%`, backgroundColor: ACCENT }}
                          />
                        </span>
                        <span className="w-16 shrink-0 text-right font-mono text-[11px] text-foreground tabular-nums">
                          {usd(t.usd)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
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

            {tab === "NFTs" &&
              !loading &&
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
                  <li
                    key={tx.id}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span
                      className={
                        tx.kind === "Receive"
                          ? "text-success-500"
                          : "text-foreground"
                      }
                    >
                      {tx.kind}
                    </span>
                    <span className="font-mono text-foreground">
                      {tx.amount} ETH
                    </span>
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
