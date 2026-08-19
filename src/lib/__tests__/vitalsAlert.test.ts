import { describe, it, expect } from "vitest";
import {
  evaluateBreaches,
  evaluatePageBreaches,
  evaluateRegressions,
  ratingBand,
  hasFindings,
  alertIssueBody,
  MIN_REGRESSION_SAMPLES,
  VITALS_ALERT_LABEL,
  type AlertReport,
} from "@/lib/vitalsAlert";
import { METRIC_CONFIGS } from "@/lib/vitals";
import type { MetricSummary, PageVitals, VersionMetrics } from "@/types/vitals";

const stat = (p75: number): MetricSummary => ({
  p75,
  good: 0,
  needsImprovement: 0,
  poor: 0,
  total: 1,
});

const emptyReport: AlertReport = { site: [], pages: [], regressions: [] };

describe("ratingBand", () => {
  it("is good at or below the Good threshold, poor above the Poor threshold", () => {
    expect(ratingBand("LCP", METRIC_CONFIGS.LCP.good)).toBe("good");
    expect(ratingBand("LCP", METRIC_CONFIGS.LCP.good + 1)).toBe(
      "needs-improvement",
    );
    expect(ratingBand("LCP", METRIC_CONFIGS.LCP.poor)).toBe("needs-improvement");
    expect(ratingBand("LCP", METRIC_CONFIGS.LCP.poor + 1)).toBe("poor");
  });
});

describe("evaluateBreaches", () => {
  it("flags a metric whose P75 is above its Poor threshold", () => {
    const breaches = evaluateBreaches({ LCP: stat(METRIC_CONFIGS.LCP.poor + 1) });

    expect(breaches).toHaveLength(1);
    expect(breaches[0]).toMatchObject({ metric: "LCP" });
  });

  it("does not flag a metric sitting exactly on the Poor threshold", () => {
    expect(evaluateBreaches({ LCP: stat(METRIC_CONFIGS.LCP.poor) })).toEqual([]);
  });

  it("skips a metric that has no samples", () => {
    expect(evaluateBreaches({})).toEqual([]);
  });

  it("works on a plain { p75 } map, not just MetricSummary", () => {
    const breaches = evaluateBreaches({
      INP: { p75: METRIC_CONFIGS.INP.poor + 10 },
    });

    expect(breaches.map((b) => b.metric)).toEqual(["INP"]);
  });

  it("returns breaches in the dashboard's metric order", () => {
    const breaches = evaluateBreaches({
      CLS: stat(METRIC_CONFIGS.CLS.poor + 0.1),
      LCP: stat(METRIC_CONFIGS.LCP.poor + 500),
    });

    expect(breaches.map((b) => b.metric)).toEqual(["LCP", "CLS"]);
  });
});

describe("evaluatePageBreaches", () => {
  const byPage: PageVitals[] = [
    {
      page: "/projects",
      total: 100,
      metrics: { LCP: { p75: METRIC_CONFIGS.LCP.poor + 300, count: 100 } },
    },
    {
      page: "/",
      total: 100,
      metrics: { LCP: { p75: METRIC_CONFIGS.LCP.good, count: 100 } },
    },
  ];

  it("flags only pages that have a Poor metric, keyed by page", () => {
    const pageBreaches = evaluatePageBreaches(byPage);

    expect(pageBreaches).toHaveLength(1);
    expect(pageBreaches[0].page).toBe("/projects");
    expect(pageBreaches[0].breaches.map((b) => b.metric)).toEqual(["LCP"]);
  });

  it("returns nothing when every page is healthy", () => {
    expect(evaluatePageBreaches([byPage[1]])).toEqual([]);
  });
});

describe("evaluateRegressions", () => {
  const version = (v: string, p75: number, total: number): VersionMetrics => ({
    version: v,
    metrics: { LCP: { p75, total } },
  });

  it("flags a metric that dropped a rating band between the last two versions", () => {
    const regressions = evaluateRegressions([
      version("5.2.1", METRIC_CONFIGS.LCP.good - 100, 100),
      version("5.3.0", METRIC_CONFIGS.LCP.good + 200, 100),
    ]);

    expect(regressions).toHaveLength(1);
    expect(regressions[0]).toMatchObject({
      metric: "LCP",
      from: "good",
      to: "needs-improvement",
      previousVersion: "5.2.1",
      currentVersion: "5.3.0",
    });
  });

  it("ignores a worse P75 that stayed inside the same band", () => {
    const regressions = evaluateRegressions([
      version("5.2.1", METRIC_CONFIGS.LCP.good - 500, 100),
      version("5.3.0", METRIC_CONFIGS.LCP.good - 100, 100),
    ]);

    expect(regressions).toEqual([]);
  });

  it("ignores a band drop when the current version is below the min-sample floor", () => {
    const regressions = evaluateRegressions([
      version("5.2.1", METRIC_CONFIGS.LCP.good - 100, 100),
      version("5.3.0", METRIC_CONFIGS.LCP.good + 200, MIN_REGRESSION_SAMPLES - 1),
    ]);

    expect(regressions).toEqual([]);
  });

  it("returns nothing with fewer than two versions", () => {
    expect(evaluateRegressions([version("5.3.0", 9999, 100)])).toEqual([]);
    expect(evaluateRegressions([])).toEqual([]);
  });
});

describe("hasFindings", () => {
  it("is false when site, pages and regressions are all empty", () => {
    expect(hasFindings(emptyReport)).toBe(false);
  });

  it("is true when any one section has something", () => {
    expect(
      hasFindings({ ...emptyReport, site: evaluateBreaches({ LCP: stat(9999) }) }),
    ).toBe(true);
    expect(
      hasFindings({
        ...emptyReport,
        pages: [{ page: "/x", breaches: evaluateBreaches({ LCP: stat(9999) }) }],
      }),
    ).toBe(true);
  });
});

describe("alertIssueBody", () => {
  const report: AlertReport = {
    site: evaluateBreaches({ LCP: stat(4200) }),
    pages: evaluatePageBreaches([
      { page: "/projects", total: 50, metrics: { INP: { p75: 620, count: 50 } } },
    ]),
    regressions: evaluateRegressions([
      { version: "5.2.1", metrics: { CLS: { p75: 0.08, total: 100 } } },
      { version: "5.3.0", metrics: { CLS: { p75: 0.2, total: 100 } } },
    ]),
  };

  it("renders each non-empty section with its findings", () => {
    const body = alertIssueBody(report, { checkedAt: "2026-08-18" });

    expect(body).toContain("4.2s");
    expect(body).toContain("/projects");
    expect(body).toContain("620ms");
    expect(body).toContain("5.3.0");
    expect(body).toContain("5.2.1");
    expect(body).toContain(VITALS_ALERT_LABEL);
  });

  it("omits a section that has no findings", () => {
    const onlyRegression: AlertReport = { ...emptyReport, regressions: report.regressions };

    const body = alertIssueBody(onlyRegression, { checkedAt: "2026-08-18" });

    expect(body).toContain("5.3.0");
    expect(body.toLowerCase()).not.toContain("by page");
  });
});
