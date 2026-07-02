"use client";

import { PieChart, Pie, ResponsiveContainer, Tooltip } from "recharts";
import { toFleetHealthData } from "@/lib/operator-chart-transforms";
import type { Store } from "@/types/operator";

interface FleetHealthChartProps {
  stores: readonly Store[];
}

/**
 * Donut chart showing the distribution of store statuses across the fleet.
 * Each slice represents online, degraded, or offline count.
 */
export default function FleetHealthChart({ stores }: FleetHealthChartProps) {
  const data = toFleetHealthData(stores);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted">
        No store data available
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <h4 className="text-xs font-medium text-muted uppercase tracking-wide">
        Fleet Health
      </h4>
      <div className="h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[...data]}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={false}
              stroke="none"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface-raised)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name) => [
                `${value} store${value !== 1 ? "s" : ""}`,
                String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 text-xs">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-muted">
              {entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
