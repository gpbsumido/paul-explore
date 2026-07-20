"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

const ACCENT = "var(--wp-accent, #38bdf8)";

const TABS = ["Game", "Web", "On-chain", "Sandbox"] as const;
type Tab = (typeof TABS)[number];

const KPI_LABELS: Record<Tab, [string, string, string]> = {
  Game: ["DAU", "Sessions", "Avg length"],
  Web: ["Visitors", "Signups", "Bounce"],
  "On-chain": ["Wallets", "Txns", "Volume"],
  Sandbox: ["Test users", "Events", "Errors"],
};

/** Deterministic per-tab numbers so switching tabs is stable. */
function tabData(tab: Tab) {
  const rng = makeRng(tab.length * 97 + tab.charCodeAt(0));
  const kpis = KPI_LABELS[tab].map((label) => ({
    label,
    value: roundish(500 + rng() * 40000),
  }));
  const bars = Array.from({ length: 7 }, (_, i) => ({
    d: `D${i + 1}`,
    v: roundish(100 + rng() * 900),
  }));
  return { kpis, bars };
}

/**
 * Vignette: the standard-analytics sections from the analytics suite,
 * prebuilt dashboards split by domain. Tabs swap the KPIs and the chart.
 */
export default function StandardAnalyticsDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [tab, setTab] = useState<Tab>("Game");
  const { kpis, bars } = tabData(tab);

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div role="tablist" className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-[12px] ${
              tab === t
                ? "border-current text-foreground"
                : "border-transparent text-muted"
            }`}
            style={tab === t ? { color: ACCENT } : undefined}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-border p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted">
              {k.label}
            </p>
            <p className="text-lg font-bold text-foreground">
              {k.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="min-h-32 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
            <XAxis dataKey="d" tick={{ fontSize: 9 }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 9 }} stroke="currentColor" />
            <Tooltip />
            <Bar dataKey="v" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {bars.map((_, i) => (
                <Cell key={i} fill={ACCENT} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
