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
              width={110}
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
