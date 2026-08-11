"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface InventoryComparisonDatum {
  readonly name: string;
  readonly health: number;
}

interface InventoryComparisonChartProps {
  data: readonly InventoryComparisonDatum[];
}

/**
 * Trims a store name to something the y-axis can actually hold.
 *
 * Store names carry a location suffix -- "Break Room Cooler - Floor 3" -- and
 * the full string is wider than the axis, so Recharts drew it past the left
 * edge of the chart and the container clipped the first characters off. "Break
 * Room Cooler" rendered as "3reak Room Cooler", which reads as a typo rather
 * than a layout bug.
 *
 * The suffix is the part worth losing: every row already sits in one store's
 * chart, so the building name earns less than the fixture name does. The full
 * name is still in the tooltip and in the chart's aria-label, so nothing is
 * actually unavailable.
 *
 * The width budget is deliberately NOT a second parameter. Recharts calls a
 * tickFormatter as (value, index), so when this was `axisLabel(name, max)`
 * wired straight in, the row index arrived as the budget: row 1 got a budget of
 * 1 and rendered as a bare ellipsis, row 2 as "G\u2026", and so on down the axis.
 * With one parameter that mistake cannot be made again.
 */
const AXIS_LABEL_MAX = 17;

export function axisLabel(name: string): string {
  const [head] = name.split(" - ");
  const label = head.trim() || name;
  return label.length > AXIS_LABEL_MAX
    ? `${label.slice(0, AXIS_LABEL_MAX - 1)}\u2026`
    : label;
}

/**
 * Returns a bar fill color based on health percentage thresholds.
 */
function healthColor(health: number): string {
  if (health >= 60) return "var(--color-success-500)";
  if (health >= 30) return "var(--color-warning-500)";
  return "var(--color-error-500)";
}

/**
 * Bar chart comparing inventory health across all stores. Quickly reveals
 * which store needs restocking most via color-coded bars.
 */
export default function InventoryComparisonChart({
  data: raw,
}: InventoryComparisonChartProps) {
  const data = useMemo(
    () => raw.map((d) => ({ ...d, fill: healthColor(d.health) })),
    [raw],
  );

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted">
        No inventory data available
      </div>
    );
  }

  const summary = data.map((d) => `${d.name}: ${d.health}%`).join(", ");

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-medium text-muted uppercase tracking-wide text-center">
        Inventory by Store
      </h4>
      <div
        role="img"
        aria-label={`Inventory health by store: ${summary}`}
        className="h-48 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...data]} layout="vertical">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={false}
              width={124}
              tickFormatter={axisLabel}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface-raised)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--color-foreground)" }}
              itemStyle={{ color: "var(--color-foreground)" }}
              formatter={(value) => [`${value}%`, "Health"]}
            />
            <Bar
              dataKey="health"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
