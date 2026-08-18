import { describe, it, expect } from "vitest";
import {
  evaluateBreaches,
  alertIssueBody,
  VITALS_ALERT_LABEL,
} from "@/lib/vitalsAlert";
import { METRIC_CONFIGS } from "@/lib/vitals";
import type { MetricSummary } from "@/types/vitals";

/** A metric summary with only p75 mattering for the threshold check. */
const stat = (p75: number): MetricSummary => ({
  p75,
  good: 0,
  needsImprovement: 0,
  poor: 0,
  total: 1,
});

describe("evaluateBreaches", () => {
  it("flags a metric whose P75 is above its Poor threshold", () => {
    const breaches = evaluateBreaches({ LCP: stat(METRIC_CONFIGS.LCP.poor + 1) });

    expect(breaches).toHaveLength(1);
    expect(breaches[0]).toMatchObject({
      metric: "LCP",
      threshold: METRIC_CONFIGS.LCP.poor,
      p75: METRIC_CONFIGS.LCP.poor + 1,
    });
  });

  it("does not flag a metric sitting exactly on the Poor threshold", () => {
    const breaches = evaluateBreaches({ LCP: stat(METRIC_CONFIGS.LCP.poor) });

    expect(breaches).toEqual([]);
  });

  it("does not flag a healthy metric below the threshold", () => {
    const breaches = evaluateBreaches({ LCP: stat(METRIC_CONFIGS.LCP.good) });

    expect(breaches).toEqual([]);
  });

  it("skips a metric that has no samples in the summary", () => {
    const breaches = evaluateBreaches({});

    expect(breaches).toEqual([]);
  });

  it("returns every breaching metric, ordered the way the dashboard orders them", () => {
    const breaches = evaluateBreaches({
      CLS: stat(METRIC_CONFIGS.CLS.poor + 0.1),
      LCP: stat(METRIC_CONFIGS.LCP.poor + 500),
      INP: stat(METRIC_CONFIGS.INP.poor + 100),
    });

    expect(breaches.map((b) => b.metric)).toEqual(["LCP", "INP", "CLS"]);
  });
});

describe("alertIssueBody", () => {
  const breaches = evaluateBreaches({
    LCP: stat(4200),
    INP: stat(620),
  });

  it("names each breaching metric with its value and Poor threshold", () => {
    const body = alertIssueBody(breaches, { checkedAt: "2026-08-17" });

    expect(body).toContain("LCP");
    expect(body).toContain("Largest Contentful Paint");
    expect(body).toContain("4.2s");
    expect(body).toContain("4.0s");
    expect(body).toContain("INP");
    expect(body).toContain("620ms");
    expect(body).toContain("500ms");
  });

  it("states how many metrics breached and when it was checked", () => {
    const body = alertIssueBody(breaches, { checkedAt: "2026-08-17" });

    expect(body).toContain("2");
    expect(body).toContain("2026-08-17");
  });

  it("carries the dedup marker so the same issue is recognised next run", () => {
    const body = alertIssueBody(breaches, { checkedAt: "2026-08-17" });

    expect(body).toContain(VITALS_ALERT_LABEL);
  });
});
