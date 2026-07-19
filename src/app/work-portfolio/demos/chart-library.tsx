"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  FunnelChart,
  Funnel,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

const ACCENT = "var(--wp-accent, #38bdf8)";
const PALETTE = ["#38bdf8", "#818cf8", "#f472b6", "#34d399", "#f59e0b", "#a3e635"];

/** Every chart takes a seed so the whole gallery re-rolls together. */
type ChartProps = { seed: number };

function GrowthCurve({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const data = Array.from({ length: 12 }, (_, i) => ({
    m: i,
    v: roundish(200 * Math.pow(1.18, i) * (0.85 + rng() * 0.3)),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
        <defs>
          <linearGradient id="wpArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.5} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="m" tick={{ fontSize: 9 }} stroke="currentColor" />
        <YAxis tick={{ fontSize: 9 }} stroke="currentColor" />
        <Tooltip />
        <Area type="monotone" dataKey="v" stroke={ACCENT} fill="url(#wpArea)" strokeWidth={2} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ConversionFunnel({ seed }: ChartProps) {
  const rng = makeRng(seed);
  let n = 10000;
  const steps = ["Visit", "Signup", "Verify", "Activate", "Pay"];
  const data = steps.map((name, i) => {
    n = roundish(n * (0.55 + rng() * 0.3));
    return { name, value: i === 0 ? 10000 : n, fill: PALETTE[i % PALETTE.length] };
  });
  return (
    <ResponsiveContainer width="100%" height="100%">
      <FunnelChart>
        <Tooltip />
        <Funnel dataKey="value" data={data} isAnimationActive={false}>
          <LabelList position="right" fill="currentColor" stroke="none" dataKey="name" fontSize={9} />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

function RetentionBars({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const data = ["D1", "D3", "D7", "D14", "D30"].map((d, i) => ({
    d,
    r: roundish(90 * Math.pow(0.72, i) * (0.9 + rng() * 0.2)),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
        <XAxis dataKey="d" tick={{ fontSize: 9 }} stroke="currentColor" />
        <YAxis tick={{ fontSize: 9 }} stroke="currentColor" />
        <Tooltip />
        <Bar dataKey="r" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RevenueDonut({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const data = ["IAP", "Ads", "Battle Pass", "Cosmetics"].map((name, i) => ({
    name,
    value: roundish(20 + rng() * 60),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip />
        <Pie data={data} dataKey="value" innerRadius="55%" outerRadius="85%" isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

const GALLERY: { key: string; title: string; Chart: (p: ChartProps) => React.ReactNode }[] = [
  { key: "growth", title: "Growth curve", Chart: GrowthCurve },
  { key: "funnel", title: "Conversion funnel", Chart: ConversionFunnel },
  { key: "retention", title: "Retention", Chart: RetentionBars },
  { key: "revenue", title: "Revenue mix", Chart: RevenueDonut },
];

/**
 * Flagship demo for the analytics suite's chart library. The original was
 * 17 documented ECharts components; this rebuilds a representative set on
 * recharts, all sharing one seed so the whole board re-rolls together.
 */
export default function ChartLibraryDemo({ feature }: { feature: WorkFeature }) {
  const [seed, setSeed] = useState(7);
  // referenced so the re-roll count is visible and stable per seed
  const rerolls = useMemo(() => Math.floor(seed / 7) - 1, [seed]);

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>
          <p className="text-[11px] text-muted">
            a slice of the 17-chart library, re-rolled {rerolls} times
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 7)}
          className="rounded-md border border-border px-2.5 py-1 text-[12px] text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        >
          Reroll data
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        {GALLERY.map(({ key, title, Chart }) => (
          <figure
            key={key}
            className="flex min-h-40 flex-col rounded-lg border border-border bg-background/40 p-2"
          >
            <figcaption className="mb-1 text-[11px] font-medium text-muted">
              {title}
            </figcaption>
            <div className="min-h-0 flex-1">
              <Chart seed={seed + key.length} />
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
