/** The five Core Web Vitals we collect and store. */
export type MetricName = "LCP" | "FCP" | "INP" | "CLS" | "TTFB";

/** Aggregated stats for a single metric across all pages — from GET /api/vitals/summary. */
export type MetricSummary = {
  p75: number;
  good: number;
  needsImprovement: number;
  poor: number;
  total: number;
};

/** P75 and sample count for one metric on one page — from GET /api/vitals/by-page. */
export type PageMetricData = {
  p75: number;
  count: number;
};

/** All vitals aggregated for a single pathname. */
export type PageVitals = {
  page: string;
  /** Total samples across all metrics for this page. */
  total: number;
  metrics: Partial<Record<MetricName, PageMetricData>>;
};

/** Shape of the GET /api/vitals response from the Next.js proxy route. */
export type VitalsResponse = {
  summary: Partial<Record<MetricName, MetricSummary>>;
  byPage: PageVitals[];
};
