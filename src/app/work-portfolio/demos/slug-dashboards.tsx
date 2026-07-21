"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  XAxis,
  Tooltip,
} from "recharts";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";
import { JsonView } from "./_shared/json-view";

/**
 * Each "slug" is a dashboard config: which tiles, which chart, what accent,
 * how the numbers read. That is the whole point of the original, one
 * catch-all route rendering many different dashboards from data alone.
 */
type Metric = { label: string; format: "count" | "pct" | "usd" | "ms" };
type ChartKind = "line" | "bar" | "area" | "radial";

type DashboardConfig = {
  slug: string;
  title: string;
  accent: string;
  chart: ChartKind;
  tiles: Metric[];
};

const CONFIGS: DashboardConfig[] = [
  {
    slug: "overview",
    title: "Fleet Overview",
    accent: "#a3e635",
    chart: "line",
    tiles: [
      { label: "Players", format: "count" },
      { label: "Retention", format: "pct" },
      { label: "Sessions", format: "count" },
    ],
  },
  {
    slug: "economy",
    title: "Economy Snapshot",
    accent: "#38bdf8",
    chart: "bar",
    tiles: [
      { label: "Supply", format: "count" },
      { label: "Sinks", format: "count" },
      { label: "Trades", format: "count" },
      { label: "Fees", format: "usd" },
    ],
  },
  {
    slug: "live-ops",
    title: "Live Ops",
    accent: "#f472b6",
    chart: "area",
    tiles: [
      { label: "Events", format: "count" },
      { label: "Uptime", format: "pct" },
      { label: "P95 Latency", format: "ms" },
    ],
  },
  {
    slug: "acquisition",
    title: "Acquisition",
    accent: "#c084fc",
    chart: "radial",
    tiles: [
      { label: "Installs", format: "count" },
      { label: "CTR", format: "pct" },
    ],
  },
];

function series(slug: string) {
  const rng = makeRng(slug.length * 71 + slug.charCodeAt(0));
  return Array.from({ length: 10 }, (_, i) => ({
    d: i,
    v: roundish(200 + rng() * 800),
  }));
}

/** Read a tile's raw number the way that metric wants to be shown. */
function formatMetric(format: Metric["format"], base: number): string {
  switch (format) {
    case "pct":
      return `${(50 + (base % 50)).toFixed(0)}%`;
    case "usd":
      return `$${(base / 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`;
    case "ms":
      return `${(base % 200) + 20}ms`;
    default:
      return base.toLocaleString();
  }
}

/**
 * Vignette: the public-dashboards project, where one catch-all route
 * rendered any dashboard from slug config. Pick a slug and the whole layout
 * reshapes, from JSON alone.
 */
export default function SlugDashboardsDemo({ feature }: { feature: WorkFeature }) {
  const [slug, setSlug] = useState(CONFIGS[0].slug);
  const config = CONFIGS.find((c) => c.slug === slug)!;
  const data = series(slug);
  const radialData = data.slice(0, 5).map((d, i) => ({
    name: `s${i}`,
    v: d.v,
    fill: config.accent,
  }));

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
          <span>/d/</span>
          <select
            aria-label="Dashboard slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded border border-border bg-background px-1.5 py-0.5 text-foreground"
          >
            {CONFIGS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.slug}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border p-3"
        style={{ borderColor: config.accent, backgroundColor: `${config.accent}12` }}
      >
        <p className="text-[12px] font-semibold" style={{ color: config.accent }}>
          {config.title}
        </p>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${config.tiles.length}, minmax(0, 1fr))` }}
        >
          {config.tiles.map((tile, i) => (
            <div
              key={tile.label}
              data-testid="dashboard-tile"
              className="rounded-md border border-border bg-background/50 p-2"
            >
              <p className="text-[9px] uppercase tracking-wider text-muted">{tile.label}</p>
              <p className="text-sm font-bold text-foreground">
                {formatMetric(tile.format, data[i % data.length].v * (i + 1))}
              </p>
            </div>
          ))}
        </div>
        <div className="min-h-24 flex-1" data-testid="dashboard-chart" data-chart-type={config.chart}>
          <ResponsiveContainer width="100%" height="100%">
            {config.chart === "line" ? (
              <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="d" hide />
                <Tooltip />
                <Line type="monotone" dataKey="v" stroke={config.accent} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            ) : config.chart === "bar" ? (
              <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="d" hide />
                <Tooltip />
                <Bar dataKey="v" fill={config.accent} radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            ) : config.chart === "area" ? (
              <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="d" hide />
                <Tooltip />
                <Area type="monotone" dataKey="v" stroke={config.accent} fill={config.accent} fillOpacity={0.25} strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            ) : (
              <RadialBarChart data={radialData} innerRadius="30%" outerRadius="100%" startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 1000]} tick={false} />
                <RadialBar dataKey="v" background cornerRadius={3} isAnimationActive={false} />
                <Tooltip />
              </RadialBarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <details className="rounded-lg border border-border" open>
        <summary className="cursor-pointer select-none px-3 py-1.5 text-[11px] font-semibold text-muted">
          config <span className="font-mono text-muted">/d/{config.slug}.json</span>
        </summary>
        <div className="px-2 pb-2">
          <JsonView value={config} />
        </div>
      </details>
    </div>
  );
}
