"use client";

import { useSyncExternalStore } from "react";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  METRIC_ORDER,
  METRIC_CONFIGS,
  formatValue,
  getRatingColor,
} from "@/lib/vitals";
import type { MetricName, VersionMetrics } from "@/types/vitals";

type DataPoint = { p75: number; version: string };

// The version tick labels sit below the plot area, so the container is the plot
// height plus room for the axis. Both the skeleton and the real chart use this
// height so they stay in sync and nothing shifts on hydration.
const CHART_AREA_HEIGHT = 80;
const CHART_CONTAINER_HEIGHT = CHART_AREA_HEIGHT + 20;

interface MetricChartProps {
  metric: MetricName;
  byVersion: VersionMetrics[];
}

/** One sparkline card for a single metric across the last 5 versions. */
function MetricTrendChart({ metric, byVersion }: MetricChartProps) {
  const config = METRIC_CONFIGS[metric];

  const data: DataPoint[] = byVersion
    .filter((v) => v.metrics[metric] !== undefined)
    .map((v) => ({
      p75: v.metrics[metric]!.p75,
      version: v.version,
    }));

  const latestP75 = data[data.length - 1]?.p75;
  const color =
    latestP75 !== undefined
      ? getRatingColor(latestP75, config.good, config.poor)
      : "#6b7280";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
        {metric}
      </span>
      <p className="mt-0.5 text-[10px] leading-tight text-muted">
        {config.label}
      </p>
      {data.length < 2 ? (
        <p className="mt-6 text-center text-[11px] text-muted">
          Not enough data
        </p>
      ) : (
        <div className="mt-2" style={{ height: CHART_CONTAINER_HEIGHT }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
            >
              <XAxis
                dataKey="version"
                tick={{ fontSize: 9, fill: "var(--color-muted)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(version: string) => `v${version}`}
                interval={0}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-raised)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 11,
                  padding: "4px 8px",
                }}
                labelStyle={{ color: "var(--color-muted)" }}
                itemStyle={{ color: "var(--color-foreground)" }}
                labelFormatter={(version: React.ReactNode) => `v${version}`}
                formatter={(value) => [
                  formatValue(value as number, config.unit),
                  "P75",
                ]}
              />
              <Line
                type="monotone"
                dataKey="p75"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// useSyncExternalStore returns false on the server and true on the client,
// which lets us skip the chart render during SSR without the lint warning
// that comes from calling setState inside an effect.
const emptySubscribe = () => () => {};

// Placeholder shown on the server (and briefly during hydration) while the
// chart measures. Matches MetricTrendChart's card structure exactly -- same grid,
// same padding, same CHART_CONTAINER_HEIGHT -- so nothing shifts when it swaps out.
function ChartSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {METRIC_ORDER.map((metric) => {
        const config = METRIC_CONFIGS[metric];
        return (
          <div
            key={metric}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              {metric}
            </span>
            <p className="mt-0.5 text-[10px] leading-tight text-muted">
              {config.label}
            </p>
            <div
              className="mt-2 rounded-lg bg-surface-raised animate-pulse"
              style={{ height: CHART_CONTAINER_HEIGHT }}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Grid of P75 trend sparklines, one per metric, across the last 5 versions. */
export default function VitalsChart({
  byVersion,
}: {
  byVersion: VersionMetrics[];
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (byVersion.length < 2) return null;

  // The chart sizes itself from the DOM -- render a matching skeleton on the
  // server so the space is already occupied when it swaps in after hydration
  if (!isClient) return <ChartSkeleton />;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {METRIC_ORDER.map((metric) => (
        <MetricTrendChart key={metric} metric={metric} byVersion={byVersion} />
      ))}
    </div>
  );
}
