import { METRIC_CONFIGS, METRIC_ORDER, formatValue } from "@/lib/vitals";
import type { MetricName, PageVitals, VersionMetrics } from "@/types/vitals";

/** The label that identifies the single open alert issue, so a later run finds
 * and reuses it instead of opening a duplicate. */
export const VITALS_ALERT_LABEL = "vitals-alert";

/** Title of the issue opened when a vital goes bad. Stable so the issue reads
 * the same each time it reopens. */
export const VITALS_ALERT_TITLE = "Web Vitals in the Poor band";

/** How many samples a current version needs before a band drop counts as a
 * regression, so a freshly-released version with a handful of data points does
 * not fire on a P75 that is really just noise. */
export const MIN_REGRESSION_SAMPLES = 30;

/** Google's three rating bands for a metric. */
export type RatingBand = "good" | "needs-improvement" | "poor";

/** One metric whose P75 has crossed Google's Poor threshold. */
export type Breach = {
  metric: MetricName;
  label: string;
  p75: number;
  threshold: number;
  formatted: string;
  formattedThreshold: string;
};

/** A page with at least one Poor metric. */
export type PageBreach = { page: string; breaches: Breach[] };

/** A metric that dropped a rating band between the last two releases. */
export type Regression = {
  metric: MetricName;
  label: string;
  from: RatingBand;
  to: RatingBand;
  previousVersion: string;
  currentVersion: string;
  previousP75: number;
  currentP75: number;
  formattedPrevious: string;
  formattedCurrent: string;
};

/** Everything one alert run found, across the three lenses. */
export type AlertReport = {
  site: Breach[];
  pages: PageBreach[];
  regressions: Regression[];
};

const BAND_RANK: Record<RatingBand, number> = {
  good: 0,
  "needs-improvement": 1,
  poor: 2,
};

const BAND_LABEL: Record<RatingBand, string> = {
  good: "Good",
  "needs-improvement": "Needs improvement",
  poor: "Poor",
};

/** Which band a P75 falls in for a metric. */
export function ratingBand(metric: MetricName, p75: number): RatingBand {
  const config = METRIC_CONFIGS[metric];
  if (p75 <= config.good) return "good";
  if (p75 <= config.poor) return "needs-improvement";
  return "poor";
}

/**
 * Flags every metric whose P75 is above its Poor threshold. Reads only `p75`,
 * so it works on a site-wide summary or a single page's metrics alike. Missing
 * metrics are skipped, and sitting exactly on the threshold is the top of
 * "needs improvement", not Poor. Dashboard metric order.
 */
export function evaluateBreaches(
  metrics: Partial<Record<MetricName, { p75: number }>>,
): Breach[] {
  return METRIC_ORDER.flatMap((metric) => {
    const stat = metrics[metric];
    if (!stat) return [];

    const config = METRIC_CONFIGS[metric];
    if (stat.p75 <= config.poor) return [];

    return [
      {
        metric,
        label: config.label,
        p75: stat.p75,
        threshold: config.poor,
        formatted: formatValue(stat.p75, config.unit),
        formattedThreshold: formatValue(config.poor, config.unit),
      },
    ];
  });
}

/** The per-page version of the site-wide check: any page with a Poor metric. */
export function evaluatePageBreaches(byPage: PageVitals[]): PageBreach[] {
  return byPage.flatMap((page) => {
    const breaches = evaluateBreaches(page.metrics);
    return breaches.length > 0 ? [{ page: page.page, breaches }] : [];
  });
}

/**
 * Flags any metric that dropped a rating band between the last two releases.
 * `byVersion` is oldest to newest, so current is the last entry and previous
 * the one before it. A worse P75 that stayed inside the same band is not a
 * regression; only a band drop is. A current version below the sample floor is
 * ignored, and fewer than two versions has nothing to compare.
 */
export function evaluateRegressions(
  byVersion: VersionMetrics[],
  { minSamples = MIN_REGRESSION_SAMPLES }: { minSamples?: number } = {},
): Regression[] {
  if (byVersion.length < 2) return [];

  const previous = byVersion[byVersion.length - 2];
  const current = byVersion[byVersion.length - 1];

  return METRIC_ORDER.flatMap((metric) => {
    const prev = previous.metrics[metric];
    const curr = current.metrics[metric];
    if (!prev || !curr) return [];
    if (curr.total < minSamples) return [];

    const from = ratingBand(metric, prev.p75);
    const to = ratingBand(metric, curr.p75);
    if (BAND_RANK[to] <= BAND_RANK[from]) return [];

    const config = METRIC_CONFIGS[metric];
    return [
      {
        metric,
        label: config.label,
        from,
        to,
        previousVersion: previous.version,
        currentVersion: current.version,
        previousP75: prev.p75,
        currentP75: curr.p75,
        formattedPrevious: formatValue(prev.p75, config.unit),
        formattedCurrent: formatValue(curr.p75, config.unit),
      },
    ];
  });
}

/** True when any lens of the report found something worth alerting on. */
export function hasFindings(report: AlertReport): boolean {
  return (
    report.site.length > 0 ||
    report.pages.length > 0 ||
    report.regressions.length > 0
  );
}

/**
 * Renders the GitHub issue body from a report, one section per non-empty lens.
 * Kept pure so the date comes in as a string rather than read from the clock.
 */
export function alertIssueBody(
  report: AlertReport,
  { checkedAt, dashboardUrl = "/vitals" }: { checkedAt: string; dashboardUrl?: string },
): string {
  const sections: string[] = [];

  if (report.site.length > 0) {
    sections.push(
      "**Site-wide, in the Poor band** (P75):",
      "",
      ...report.site.map(
        (b) => `- **${b.metric}** (${b.label}): ${b.formatted}, past ${b.formattedThreshold}`,
      ),
      "",
    );
  }

  if (report.pages.length > 0) {
    sections.push(
      "**By page, in the Poor band** (P75):",
      "",
      ...report.pages.map(
        (p) =>
          `- \`${p.page}\`: ${p.breaches
            .map((b) => `${b.metric} ${b.formatted} (past ${b.formattedThreshold})`)
            .join(", ")}`,
      ),
      "",
    );
  }

  if (report.regressions.length > 0) {
    sections.push(
      "**Regressed since the last release** (rating band dropped):",
      "",
      ...report.regressions.map(
        (r) =>
          `- **${r.metric}** (${r.label}): ${BAND_LABEL[r.from]} → ${BAND_LABEL[r.to]}, ${r.formattedPrevious} on ${r.previousVersion} → ${r.formattedCurrent} on ${r.currentVersion}`,
      ),
      "",
    );
  }

  return [
    ...sections,
    `Checked ${checkedAt}. Full breakdown at [${dashboardUrl}](${dashboardUrl}).`,
    "",
    `<!-- ${VITALS_ALERT_LABEL} -->`,
  ].join("\n");
}
