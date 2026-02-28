"use client";

import { useSyncExternalStore } from "react";
import {
  VisXYContainer,
  VisLine,
  VisAxis,
  VisCrosshair,
  VisTooltip,
} from "@unovis/react";
import { CurveType } from "@unovis/ts";
import { METRIC_ORDER, METRIC_CONFIGS, formatValue, getRatingColor } from "@/lib/vitals";
import type { MetricName, VersionMetrics } from "@/types/vitals";

type DataPoint = { index: number; p75: number; version: string };

interface MetricChartProps {
  metric: MetricName;
  byVersion: VersionMetrics[];
}

/** One sparkline card for a single metric across the last 5 versions. */
function MetricTrendChart({ metric, byVersion }: MetricChartProps) {
  const config = METRIC_CONFIGS[metric];

  const data: DataPoint[] = byVersion
    .filter((v) => v.metrics[metric] !== undefined)
    .map((v, i) => ({
      index: i,
      p75: v.metrics[metric]!.p75,
      version: v.version,
    }));

  const latestP75 = data[data.length - 1]?.p75;
  const color =
    latestP75 !== undefined
      ? getRatingColor(latestP75, config.good, config.poor)
      : "#6b7280";

  const x = (_d: DataPoint, i: number) => i;
  const y = (d: DataPoint) => d.p75;

  const tooltipTemplate = (d: DataPoint) =>
    `<div style="padding:4px 8px;font-size:11px;line-height:1.5">` +
    `<span style="opacity:0.6">v${d.version}</span><br/>` +
    `<strong>${formatValue(d.p75, config.unit)}</strong>` +
    `</div>`;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
        {metric}
      </span>
      <p className="mt-0.5 text-[10px] leading-tight text-muted/60">
        {config.label}
      </p>
      {data.length < 2 ? (
        <p className="mt-6 text-center text-[11px] text-muted/30">
          Not enough data
        </p>
      ) : (
        <div className="mt-2">
          <VisXYContainer data={data} height={80}>
            <VisLine x={x} y={y} color={color} curveType={CurveType.MonotoneX} />
            <VisAxis
              type="x"
              tickValues={data.map((_, i) => i)}
              tickFormat={(v: number | Date) =>
                `v${data[Math.round(v as number)]?.version ?? ""}`
              }
            />
            <VisCrosshair template={tooltipTemplate} />
            <VisTooltip />
          </VisXYContainer>
        </div>
      )}
    </div>
  );
}

// useSyncExternalStore returns false on the server and true on the client,
// which lets us skip the unovis render during SSR without the lint warning
// that comes from calling setState inside an effect.
const emptySubscribe = () => () => {};

/** Grid of P75 trend sparklines, one per metric, across the last 5 versions. */
export default function VitalsChart({ byVersion }: { byVersion: VersionMetrics[] }) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!isClient || byVersion.length < 2) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {METRIC_ORDER.map((metric) => (
        <MetricTrendChart key={metric} metric={metric} byVersion={byVersion} />
      ))}
    </div>
  );
}
