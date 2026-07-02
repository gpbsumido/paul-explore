"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { toAlertTrendData } from "@/lib/operator-chart-transforms";
import type { Alert } from "@/types/operator";

interface AlertTrendChartProps {
  alerts: readonly Alert[];
}

/**
 * Area chart showing alert volume over the last 24 hours. Helps operators
 * see whether alert frequency is trending up or down.
 */
export default function AlertTrendChart({ alerts }: AlertTrendChartProps) {
  const data = useMemo(() => toAlertTrendData(alerts), [alerts]);

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-medium text-muted uppercase tracking-wide text-center">
        Alert Trend (24h)
      </h4>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[...data]}>
            <defs>
              <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-warning-500)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-warning-500)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={false}
              width={24}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface-raised)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => [
                `${value} alert${value !== 1 ? "s" : ""}`,
                "Count",
              ]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--color-warning-500)"
              fill="url(#alertGradient)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
