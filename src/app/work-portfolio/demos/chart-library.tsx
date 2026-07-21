"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
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
  const data = ["IAP", "Ads", "Battle Pass", "Cosmetics"].map((name) => ({
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

function EngagementGauge({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const pct = roundish(45 + rng() * 45);
  const data = [{ name: "engaged", value: pct, fill: ACCENT }];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart
        innerRadius="60%"
        outerRadius="100%"
        data={data}
        startAngle={210}
        endAngle={-30}
      >
        <RadialBar dataKey="value" background cornerRadius={6} isAnimationActive={false} />
        <text x="50%" y="52%" textAnchor="middle" fill="currentColor" fontSize={18} fontWeight={700}>
          {pct}%
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

function RankedTable({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const rows = ["Game A", "Game B", "Game C", "Game D", "Game E"]
    .map((name) => ({ name, dau: roundish(2000 + rng() * 18000) }))
    .sort((a, b) => b.dau - a.dau);
  const max = rows[0].dau;
  return (
    <div className="flex h-full flex-col justify-center gap-1.5">
      {rows.map((r, i) => (
        <div key={r.name} className="flex items-center gap-2 text-[10px]">
          <span className="w-12 shrink-0 text-muted">{r.name}</span>
          <span className="h-3 flex-1 overflow-hidden rounded-sm bg-black/5 dark:bg-white/10">
            <span
              className="block h-full rounded-sm"
              style={{ width: `${(r.dau / max) * 100}%`, backgroundColor: PALETTE[i % PALETTE.length] }}
            />
          </span>
          <span className="w-12 shrink-0 text-right tabular-nums text-foreground">
            {r.dau.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

const axis = { tick: { fontSize: 9 }, stroke: "currentColor" } as const;

function CohortHeatmap({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const rows = ["Jan", "Feb", "Mar", "Apr"];
  return (
    <div className="flex h-full flex-col justify-center gap-1">
      {rows.map((r) => (
        <div key={r} className="flex items-center gap-1">
          <span className="w-6 shrink-0 text-[8px] text-muted">{r}</span>
          {Array.from({ length: 6 }, (_, wi) => {
            const v = 100 * Math.pow(0.7, wi) * (0.8 + rng() * 0.4);
            return (
              <span
                key={wi}
                className="h-4 flex-1 rounded-sm"
                style={{ backgroundColor: ACCENT, opacity: 0.12 + (v / 100) * 0.88 }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ParetoChart({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const raw = ["Crash", "Lag", "UI", "Login", "Audio", "Other"]
    .map((name) => ({ name, count: roundish(20 + rng() * 180) }))
    .sort((a, b) => b.count - a.count);
  const total = raw.reduce((s, d) => s + d.count, 0);
  let cum = 0;
  const data = raw.map((d) => {
    cum += d.count;
    return { ...d, cum: roundish((cum / total) * 100) };
  });
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: -24 }}>
        <XAxis dataKey="name" {...axis} />
        <YAxis yAxisId="l" {...axis} />
        <YAxis yAxisId="r" orientation="right" {...axis} />
        <Tooltip />
        <Bar yAxisId="l" dataKey="count" fill={ACCENT} radius={[3, 3, 0, 0]} isAnimationActive={false} />
        <Line yAxisId="r" dataKey="cum" stroke={PALETTE[2]} strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function WordCloud({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const words = [
    "fun", "laggy", "addictive", "balanced", "grindy", "polished",
    "p2w", "chill", "hard", "social", "buggy", "fresh",
  ];
  return (
    <div className="flex h-full flex-wrap content-center items-center justify-center gap-x-2 gap-y-0.5 overflow-hidden p-1">
      {words.map((w, i) => (
        <span
          key={w}
          className="font-semibold leading-none"
          style={{
            fontSize: 9 + Math.floor(rng() * 15),
            color: PALETTE[i % PALETTE.length],
            opacity: 0.55 + rng() * 0.45,
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

function TimeSeriesKpi({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const data = Array.from({ length: 14 }, (_, i) => ({
    i,
    v: roundish(1000 + i * 80 + rng() * 300),
  }));
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline gap-1">
        <span className="text-[20px] font-bold text-foreground">
          {data[data.length - 1].v.toLocaleString()}
        </span>
        <span className="text-[10px] text-muted">DAU</span>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <Area dataKey="v" stroke={ACCENT} fill={ACCENT} fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DauMauLine({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const data = Array.from({ length: 12 }, (_, m) => ({
    m,
    dau: roundish(500 + m * 40 + rng() * 200),
    mau: roundish(3000 + m * 120 + rng() * 400),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
        <XAxis dataKey="m" {...axis} />
        <YAxis {...axis} />
        <Tooltip />
        <Line dataKey="dau" stroke={PALETTE[0]} dot={false} strokeWidth={2} isAnimationActive={false} />
        <Line dataKey="mau" stroke={PALETTE[1]} dot={false} strokeWidth={2} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SessionHistogram({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const data = ["0-5", "5-15", "15-30", "30-60", "60+"].map((b, i) => ({
    b,
    n: roundish(50 + rng() * Math.max(20, 300 - i * 50)),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
        <XAxis dataKey="b" {...axis} />
        <YAxis {...axis} />
        <Tooltip />
        <Bar dataKey="n" fill={PALETTE[3]} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function GeoSplit({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const data = ["NA", "EU", "APAC", "LATAM", "MEA"]
    .map((name) => ({ name, v: roundish(500 + rng() * 4000) }))
    .sort((a, b) => b.v - a.v);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 2, right: 6, bottom: 0, left: 0 }}>
        <XAxis type="number" {...axis} hide />
        <YAxis type="category" dataKey="name" {...axis} width={40} />
        <Tooltip />
        <Bar dataKey="v" radius={[0, 3, 3, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function StackedArea({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const data = Array.from({ length: 10 }, (_, i) => ({
    i,
    iap: roundish(100 + rng() * 80),
    ads: roundish(60 + rng() * 60),
    bp: roundish(40 + rng() * 50),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
        <XAxis dataKey="i" {...axis} />
        <YAxis {...axis} />
        <Tooltip />
        {(["iap", "ads", "bp"] as const).map((k, i) => (
          <Area
            key={k}
            dataKey={k}
            stackId="1"
            stroke={PALETTE[i]}
            fill={PALETTE[i]}
            fillOpacity={0.5}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Correlation({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const data = Array.from({ length: 24 }, () => ({
    x: roundish(rng() * 100),
    y: roundish(rng() * 100),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
        <XAxis type="number" dataKey="x" {...axis} />
        <YAxis type="number" dataKey="y" {...axis} />
        <ZAxis range={[18, 18]} />
        <Tooltip />
        <Scatter data={data} fill={ACCENT} isAnimationActive={false} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function RadarMetrics({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const data = ["Speed", "Power", "Range", "Defense", "Utility", "Cost"].map(
    (m) => ({ m, v: roundish(30 + rng() * 70) }),
  );
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis dataKey="m" tick={{ fontSize: 8, fill: "currentColor" }} />
        <Radar dataKey="v" stroke={ACCENT} fill={ACCENT} fillOpacity={0.4} isAnimationActive={false} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function KpiTiles({ seed }: ChartProps) {
  const rng = makeRng(seed);
  const tiles = [
    { label: "ARPU", value: `$${(1 + rng() * 4).toFixed(2)}` },
    { label: "D7 ret", value: `${roundish(20 + rng() * 30)}%` },
    { label: "Sessions", value: `${roundish(2 + rng() * 6)}` },
  ];
  return (
    <div className="grid h-full grid-cols-3 items-center gap-1.5">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-md border border-border p-1.5 text-center">
          <p className="text-[15px] font-bold text-foreground">{t.value}</p>
          <p className="text-[8px] text-muted">{t.label}</p>
        </div>
      ))}
    </div>
  );
}

const GALLERY: { key: string; title: string; Chart: (p: ChartProps) => React.ReactNode }[] = [
  { key: "growth", title: "Growth curve", Chart: GrowthCurve },
  { key: "funnel", title: "Conversion funnel", Chart: ConversionFunnel },
  { key: "retention", title: "Retention", Chart: RetentionBars },
  { key: "revenue", title: "Revenue mix", Chart: RevenueDonut },
  { key: "engagement", title: "Engagement", Chart: EngagementGauge },
  { key: "ranked", title: "Top titles", Chart: RankedTable },
  { key: "cohort", title: "Cohort retention", Chart: CohortHeatmap },
  { key: "pareto", title: "Pareto (bugs)", Chart: ParetoChart },
  { key: "words", title: "Sentiment cloud", Chart: WordCloud },
  { key: "kpi", title: "DAU trend", Chart: TimeSeriesKpi },
  { key: "daumau", title: "DAU vs MAU", Chart: DauMauLine },
  { key: "sessions", title: "Session length", Chart: SessionHistogram },
  { key: "geo", title: "By region", Chart: GeoSplit },
  { key: "stack", title: "Revenue over time", Chart: StackedArea },
  { key: "scatter", title: "Correlation", Chart: Correlation },
  { key: "radar", title: "Balance radar", Chart: RadarMetrics },
  { key: "tiles", title: "KPI tiles", Chart: KpiTiles },
];

/**
 * Flagship demo for the analytics suite's chart library. The original was
 * 17 documented ECharts components; this rebuilds a representative set on
 * recharts, all sharing one seed so the whole board re-rolls together.
 */
export default function ChartLibraryDemo({ feature }: { feature: WorkFeature }) {
  const [seed, setSeed] = useState(7);
  const [mode, setMode] = useState<"grid" | "focus">("grid");
  const [focusIndex, setFocusIndex] = useState(0);
  // referenced so the re-roll count is visible and stable per seed
  const rerolls = useMemo(() => Math.floor(seed / 7) - 1, [seed]);

  const focused = GALLERY[focusIndex];
  const stepFocus = (d: 1 | -1) =>
    setFocusIndex((i) => (i + d + GALLERY.length) % GALLERY.length);

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>
          <p className="text-[11px] text-muted">
            all 17 chart types, re-rolled {rerolls} times
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-border text-[12px]">
            {(["grid", "focus"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 capitalize ${
                  mode === m ? "bg-black/10 text-foreground dark:bg-white/15" : "text-muted"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <Button variant="outline" size="xs" onClick={() => setSeed((s) => s + 7)}>
            Reroll data
          </Button>
        </div>
      </div>

      {mode === "grid" ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY.map(({ key, title, Chart }) => (
            <figure
              key={key}
              className="flex min-h-36 flex-col rounded-lg border border-border bg-background/40 p-2"
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
      ) : (
        <figure className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-background/40 p-3">
          <figcaption className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-medium text-foreground">
              {focused.title}
            </span>
            <span className="flex gap-1">
              <IconButton
                size="sm"
                aria-label="Previous chart"
                onClick={() => stepFocus(-1)}
                className="!h-6 !w-6 border border-border text-[11px]"
              >
                ‹
              </IconButton>
              <IconButton
                size="sm"
                aria-label="Next chart"
                onClick={() => stepFocus(1)}
                className="!h-6 !w-6 border border-border text-[11px]"
              >
                ›
              </IconButton>
            </span>
          </figcaption>
          {/* concrete min-height so recharts' ResponsiveContainer measures a
              non-zero size on mount; a bare flex-1/min-h-0 read 0 and the
              chart never rendered */}
          <div className="min-h-[15rem] flex-1">
            <focused.Chart seed={seed + focused.key.length} />
          </div>
        </figure>
      )}
    </div>
  );
}
