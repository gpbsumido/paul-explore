"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type AccuracyPoint = { attempt: number; within: number; level: string };

/**
 * The recharts line on its own, so the results page can load it after the
 * cards and table instead of shipping recharts in its first load.
 */
export default function AccuracyPlot({ data }: { data: readonly AccuracyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={[...data]} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="attempt" tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false} />
        <YAxis
          domain={[0, 5]}
          ticks={[0, 1, 2, 3, 4, 5]}
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", fontSize: 12 }}
          labelFormatter={(attempt) => `Attempt ${attempt}`}
          formatter={(value, _name, item) => [`${value} of 5 (${item.payload.level})`, "Within tolerance"]}
        />
        <Line
          type="monotone"
          dataKey="within"
          stroke="var(--color-foreground)"
          strokeWidth={2}
          dot={{ r: 3 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
