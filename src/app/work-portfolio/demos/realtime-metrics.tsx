"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip } from "./_shared/ChartTooltip";
import type { WorkFeature } from "../_data/types";

/** Seeded starting series so the chart never opens empty. */
const INITIAL_SERIES = [42, 45, 44, 48, 53, 51, 57, 60, 58, 64, 69, 67];

const TICK_MS = 1500;

/**
 * Reference demo: the live campaign dashboard from the driver onboarding
 * take-home. A local interval stands in for the polling API, everything
 * else works like the original, KPIs up top and a signups line below.
 */
export default function RealtimeMetricsDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [series, setSeries] = useState(INITIAL_SERIES);
  const [signups, setSignups] = useState(1284);
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      setSignups((s) => s + Math.floor(Math.random() * 4) + 1);
      setSeries((prev) => {
        const last = prev[prev.length - 1];
        const next = Math.max(30, last + Math.floor(Math.random() * 11) - 4);
        return [...prev.slice(1), next];
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [live]);

  // Fire a campaign burst: a big jump the operator can trigger on demand.
  const spike = () => {
    setSignups((s) => s + 40 + Math.floor(Math.random() * 30));
    setSeries((prev) => [
      ...prev.slice(1),
      Math.round(prev[prev.length - 1] * 1.6 + 20),
    ]);
  };

  const conversion = ((signups % 90) / 10 + 14).toFixed(1);
  const data = series.map((value, i) => ({
    minute: `-${series.length - i}m`,
    value,
  }));

  return (
    <div
      className="flex h-full min-h-64 flex-col gap-4 p-5 text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(58% 44% at 50% 0%, hsl(160 62% 45% / 0.16), transparent 62%)",
      }}
    >
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-muted">
            Driver onboarding{" "}
            <span style={{ color: "hsl(160 62% 52%)" }}>/</span> live
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {feature.title}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={spike}
            className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase text-foreground transition-colors hover:bg-white/10"
          >
            ⚡ Spike
          </button>
          <button
            type="button"
            aria-pressed={live}
            onClick={() => setLive((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase"
            style={{ color: live ? "hsl(160 62% 55%)" : "var(--color-muted)" }}
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${live ? "motion-safe:animate-pulse" : ""}`}
              style={{ background: live ? "hsl(160 62% 52%)" : "var(--color-muted)" }}
            />
            {live ? `Live · ${TICK_MS / 1000}s` : "Paused"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Signups", value: signups.toLocaleString(), testid: "signup-count" },
          { label: "Conversion", value: `${conversion}%` },
          { label: "Top campaign", value: "spring-drive" },
        ].map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-sm"
          >
            <p className="text-[10px] uppercase tracking-wider text-muted">
              {tile.label}
            </p>
            <p
              className="font-display text-2xl font-bold tabular-nums"
              data-testid={tile.testid}
            >
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      <div className="min-h-40 flex-1" aria-label="Signups per minute chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
          >
            <XAxis
              dataKey="minute"
              tick={{ fontSize: 10 }}
              stroke="currentColor"
            />
            <YAxis tick={{ fontSize: 10 }} stroke="currentColor" />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--wp-accent, #34d399)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
