"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

/**
 * Each "slug" is a dashboard config: which tiles, which chart, what accent.
 * This is the whole point of the original, one catch-all route rendering
 * many dashboards from data alone.
 */
type DashboardConfig = {
  slug: string;
  title: string;
  accent: string;
  chart: "line" | "bar";
  tiles: string[];
};

const CONFIGS: DashboardConfig[] = [
  {
    slug: "overview",
    title: "Fleet Overview",
    accent: "#a3e635",
    chart: "line",
    tiles: ["Players", "Retention", "Sessions"],
  },
  {
    slug: "economy",
    title: "Economy Snapshot",
    accent: "#38bdf8",
    chart: "bar",
    tiles: ["Supply", "Sinks", "Trades", "Fees"],
  },
  {
    slug: "live-ops",
    title: "Live Ops",
    accent: "#f472b6",
    chart: "line",
    tiles: ["Events", "Uptime"],
  },
];

function series(slug: string) {
  const rng = makeRng(slug.length * 71 + slug.charCodeAt(0));
  return Array.from({ length: 10 }, (_, i) => ({
    d: i,
    v: roundish(200 + rng() * 800),
  }));
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
          {config.tiles.map((t, i) => (
            <div key={t} className="rounded-md border border-border bg-background/50 p-2">
              <p className="text-[9px] uppercase tracking-wider text-muted">{t}</p>
              <p className="text-sm font-bold text-foreground">
                {(data[i % data.length].v * (i + 1)).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <div className="min-h-24 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            {config.chart === "line" ? (
              <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="d" hide />
                <Tooltip />
                <Line type="monotone" dataKey="v" stroke={config.accent} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="d" hide />
                <Tooltip />
                <Bar dataKey="v" fill={config.accent} radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
