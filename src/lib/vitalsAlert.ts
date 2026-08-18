import { METRIC_CONFIGS, METRIC_ORDER, formatValue } from "@/lib/vitals";
import type { MetricName, MetricSummary } from "@/types/vitals";

/** The label that identifies the single open alert issue, so a later run finds
 * and reuses it instead of opening a duplicate. */
export const VITALS_ALERT_LABEL = "vitals-alert";

/** Title of the issue opened when a vital goes bad. Stable so the issue reads
 * the same each time it reopens. */
export const VITALS_ALERT_TITLE = "Web Vitals in the Poor band";

/** One metric whose site-wide P75 has crossed Google's Poor threshold. */
export type Breach = {
  metric: MetricName;
  label: string;
  p75: number;
  threshold: number;
  formatted: string;
  formattedThreshold: string;
};

/**
 * Finds every metric whose P75 sits above its Poor threshold.
 *
 * A metric missing from the summary has no samples, so it is skipped rather
 * than treated as zero or as bad. Sitting exactly on the threshold is the top
 * of the "needs improvement" band, not Poor, so it does not breach. Results
 * come back in the dashboard's metric order so the issue reads predictably.
 */
export function evaluateBreaches(
  summary: Partial<Record<MetricName, MetricSummary>>,
): Breach[] {
  return METRIC_ORDER.flatMap((metric) => {
    const stat = summary[metric];
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

/**
 * Renders the GitHub issue body for a set of breaches. Kept pure so the date
 * comes in as a string rather than being read from the clock here.
 */
export function alertIssueBody(
  breaches: Breach[],
  { checkedAt, dashboardUrl = "/vitals" }: { checkedAt: string; dashboardUrl?: string },
): string {
  const noun = breaches.length === 1 ? "metric is" : "metrics are";
  const lines = breaches.map(
    (b) =>
      `- **${b.metric}** (${b.label}): ${b.formatted}, past the Poor threshold of ${b.formattedThreshold}`,
  );

  return [
    `**${breaches.length} ${noun} in the Poor band** (site-wide P75):`,
    "",
    ...lines,
    "",
    `Checked ${checkedAt}. Full breakdown at [${dashboardUrl}](${dashboardUrl}).`,
    "",
    `<!-- ${VITALS_ALERT_LABEL} -->`,
  ].join("\n");
}
