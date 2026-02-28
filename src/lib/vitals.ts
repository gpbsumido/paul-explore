import type { MetricName } from "@/types/vitals";

export const METRIC_ORDER: MetricName[] = ["LCP", "FCP", "INP", "CLS", "TTFB"];

export type MetricConfig = {
  name: MetricName;
  label: string;
  // "ms" for timing metrics, "" for unitless scores like CLS
  unit: "ms" | "";
  // Google's Good threshold -- at or below is green
  good: number;
  // Google's Poor threshold -- above is red, between is yellow
  poor: number;
};

export const METRIC_CONFIGS: Record<MetricName, MetricConfig> = {
  LCP: { name: "LCP", label: "Largest Contentful Paint", unit: "ms", good: 2500, poor: 4000 },
  FCP: { name: "FCP", label: "First Contentful Paint",  unit: "ms", good: 1800, poor: 3000 },
  INP: { name: "INP", label: "Interaction to Next Paint", unit: "ms", good: 200,  poor: 500  },
  CLS: { name: "CLS", label: "Cumulative Layout Shift",  unit: "",   good: 0.1,  poor: 0.25 },
  TTFB:{ name: "TTFB",label: "Time to First Byte",       unit: "ms", good: 800,  poor: 1800 },
};

/** 340ms below 1s, 2.4s above. CLS stays as a decimal (0.042). */
export function formatValue(value: number, unit: "ms" | ""): string {
  if (unit === "") return value.toFixed(3);
  return value >= 1000
    ? `${(value / 1000).toFixed(1)}s`
    : `${Math.round(value)}ms`;
}

/** Returns the hex color for a metric value based on Good/Poor thresholds. */
export function getRatingColor(value: number, good: number, poor: number): string {
  if (value <= good) return "#22c55e";
  if (value <= poor) return "#eab308";
  return "#ef4444";
}
