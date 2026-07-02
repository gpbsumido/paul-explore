"use client";

import { useMemo } from "react";
import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";
import {
  generateSparklineData,
  categorizeStock,
  type StockStatus,
} from "@/lib/operator-detail";

interface StockSparklineProps {
  currentStock: number;
  capacity: number;
  itemId: string;
}

const STROKE_COLORS: Record<StockStatus, string> = {
  healthy: "var(--color-success-500)",
  low: "var(--color-warning-500)",
  critical: "var(--color-error-500)",
  "out-of-stock": "var(--color-error-500)",
};

/**
 * Tiny sparkline showing a simulated 7-day stock trend. The line color
 * matches the current stock status so it visually ties into the row's
 * health indicator.
 */
export default function StockSparkline({
  currentStock,
  capacity,
  itemId,
}: StockSparklineProps) {
  const data = useMemo(
    () => generateSparklineData(currentStock, capacity, itemId),
    [currentStock, capacity, itemId],
  );

  const status = categorizeStock(currentStock, capacity);
  const stroke = STROKE_COLORS[status];

  return (
    <div className="h-6 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data]}>
          <YAxis domain={[0, capacity]} hide />
          <Line
            type="monotone"
            dataKey="stock"
            stroke={stroke}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
