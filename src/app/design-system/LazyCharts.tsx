"use client";

import dynamic from "next/dynamic";

/**
 * The chart/viz family, code-split out of the showcase's initial bundle.
 *
 * They all pull in the heavy chart-geometry core and are only previewed in the
 * gallery (below the fold). The showcase is a Server Component, so it can't do an
 * `ssr: false` dynamic import itself — this client module does it for the whole
 * family, so the geometry core loads only when the charts scroll into view. A
 * skeleton holds each preview's box so the gallery cards don't shift.
 */
const skeleton = () => (
  <div className="h-full min-h-[7rem] w-full animate-pulse rounded-lg bg-surface" aria-hidden />
);

export const BarChart = dynamic(() => import("@paul-portfolio/react").then((m) => ({ default: m.BarChart })), { ssr: false, loading: skeleton });
export const DonutChart = dynamic(() => import("@paul-portfolio/react").then((m) => ({ default: m.DonutChart })), { ssr: false, loading: skeleton });
export const FunnelChart = dynamic(() => import("@paul-portfolio/react").then((m) => ({ default: m.FunnelChart })), { ssr: false, loading: skeleton });
export const GaugeChart = dynamic(() => import("@paul-portfolio/react").then((m) => ({ default: m.GaugeChart })), { ssr: false, loading: skeleton });
export const HeatmapChart = dynamic(() => import("@paul-portfolio/react").then((m) => ({ default: m.HeatmapChart })), { ssr: false, loading: skeleton });
export const ParetoChart = dynamic(() => import("@paul-portfolio/react").then((m) => ({ default: m.ParetoChart })), { ssr: false, loading: skeleton });
export const RadarChart = dynamic(() => import("@paul-portfolio/react").then((m) => ({ default: m.RadarChart })), { ssr: false, loading: skeleton });
export const ScatterPlot = dynamic(() => import("@paul-portfolio/react").then((m) => ({ default: m.ScatterPlot })), { ssr: false, loading: skeleton });
export const Sparkline = dynamic(() => import("@paul-portfolio/react").then((m) => ({ default: m.Sparkline })), { ssr: false, loading: skeleton });
export const StackedLineChart = dynamic(() => import("@paul-portfolio/react").then((m) => ({ default: m.StackedLineChart })), { ssr: false, loading: skeleton });
export const WordCloud = dynamic(() => import("@paul-portfolio/react").then((m) => ({ default: m.WordCloud })), { ssr: false, loading: skeleton });
