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

  useEffect(() => {
    const timer = setInterval(() => {
      setSignups((s) => s + Math.floor(Math.random() * 4) + 1);
      setSeries((prev) => {
        const last = prev[prev.length - 1];
        const next = Math.max(30, last + Math.floor(Math.random() * 11) - 4);
        return [...prev.slice(1), next];
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const conversion = ((signups % 90) / 10 + 14).toFixed(1);
  const data = series.map((value, i) => ({ minute: `-${series.length - i}m`, value }));

  return (
    <div className="flex h-full min-h-64 flex-col gap-4 p-6">
      <div>
        <p className="text-[13px] font-semibold text-foreground">
          {feature.title}
        </p>
        <p className="text-[11px] text-muted">
          live campaign metrics, updating every {TICK_MS / 1000}s
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted">
            Signups
          </p>
          <p
            className="text-xl font-bold text-foreground"
            data-testid="signup-count"
          >
            {signups.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted">
            Conversion
          </p>
          <p className="text-xl font-bold text-foreground">{conversion}%</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted">
            Top campaign
          </p>
          <p className="text-xl font-bold text-foreground">spring-drive</p>
        </div>
      </div>

      <div className="min-h-40 flex-1" aria-label="Signups per minute chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="minute" tick={{ fontSize: 10 }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 10 }} stroke="currentColor" />
            <Tooltip />
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
