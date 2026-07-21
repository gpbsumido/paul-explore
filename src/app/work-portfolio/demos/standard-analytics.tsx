"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

const ACCENT = "var(--wp-accent, #38bdf8)";

const TABS = ["Game", "Web", "On-chain", "Sandbox"] as const;
type Tab = (typeof TABS)[number];

const METRICS: Record<Tab, [string, string, string]> = {
  Game: ["DAU", "Sessions", "Avg length"],
  Web: ["Visitors", "Signups", "Bounce %"],
  "On-chain": ["Wallets", "Txns", "Volume"],
  Sandbox: ["Test users", "Events", "Errors"],
};

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const SEGMENTS = ["All", "New", "Returning"] as const;
type Segment = (typeof SEGMENTS)[number];
const SEG_MULT: Record<Segment, number> = { All: 1, New: 0.4, Returning: 0.6 };

/** A deterministic time series for one metric, shaped by range and segment. */
function metricSeries(
  tab: Tab,
  metricIdx: number,
  range: Range,
  segment: Segment,
) {
  const rng = makeRng(
    tab.length * 97 + tab.charCodeAt(0) + metricIdx * 13 + range,
  );
  const mult = SEG_MULT[segment];
  const base = 300 + metricIdx * 400;
  return Array.from({ length: range }, (_, i) => ({
    i,
    v: roundish((base + i * (range > 30 ? 4 : 18) + rng() * base * 0.5) * mult),
  }));
}

const latestOf = (series: { v: number }[]) => series[series.length - 1]?.v ?? 0;

/**
 * Vignette: the standard-analytics sections from the analytics suite. Tabs pick
 * a domain; the KPI cards double as metric selectors; and a range and segment
 * filter recompute the interactive area chart.
 */
export default function StandardAnalyticsDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [tab, setTab] = useState<Tab>("Game");
  const [metricIdx, setMetricIdx] = useState(0);
  const [range, setRange] = useState<Range>(30);
  const [segment, setSegment] = useState<Segment>("All");

  const metrics = METRICS[tab];
  const metricName = metrics[metricIdx];
  const series = metricSeries(tab, metricIdx, range, segment);

  const changeTab = (t: Tab) => {
    setTab(t);
    setMetricIdx(0);
  };

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">
          {feature.title}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={`px-2 py-1 ${
                  range === r
                    ? "bg-black/10 text-foreground dark:bg-white/15"
                    : "text-muted"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
          <select
            aria-label="Segment"
            value={segment}
            onChange={(e) => setSegment(e.target.value as Segment)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-foreground"
          >
            {SEGMENTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div role="tablist" className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => changeTab(t)}
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
        {metrics.map((label, i) => {
          const value = latestOf(metricSeries(tab, i, range, segment));
          const active = i === metricIdx;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => setMetricIdx(i)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                active
                  ? "border-foreground/40 bg-foreground/[0.04]"
                  : "border-border hover:bg-foreground/[0.02]"
              }`}
            >
              <p className="text-[11px] uppercase tracking-wider text-muted">
                {label}
              </p>
              <p className="text-lg font-bold text-foreground">
                {value.toLocaleString()}
              </p>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted">
        {metricName} over {range} days · {segment}
      </p>

      {/* absolute-inset wrapper gives recharts a definite-height parent; a bare
          flex-1/min-h child leaves height:100% resolving to 0 and no chart draws */}
      <div className="relative min-h-32 flex-1">
        <ResponsiveContainer
          width="100%"
          height="100%"
          className="!absolute inset-0"
        >
          <AreaChart data={series} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="saArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
            <XAxis dataKey="i" tick={{ fontSize: 9 }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 9 }} stroke="currentColor" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="v"
              stroke={ACCENT}
              fill="url(#saArea)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
