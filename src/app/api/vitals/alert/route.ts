import { NextResponse, type NextRequest } from "next/server";
import { fetchUpstream, type UpstreamResult } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";
import {
  evaluateBreaches,
  evaluatePageBreaches,
  evaluateRegressions,
  hasFindings,
  alertIssueBody,
  VITALS_ALERT_LABEL,
  VITALS_ALERT_TITLE,
  type AlertReport,
} from "@/lib/vitalsAlert";
import {
  findOpenIssue,
  createIssue,
  updateIssue,
  closeIssue,
} from "@/lib/githubIssues";
import type { MetricName, PageVitals, VersionMetrics } from "@/types/vitals";

const DEFAULT_REPO = "gpbsumido/paul-explore";
const RECOVERY_COMMENT = "All vitals are back within thresholds. Closing.";

// GET /api/vitals/alert
// The Web Vitals watchdog, run on a schedule by Vercel Cron. It reads three
// aggregates and turns three kinds of regression into a single GitHub issue:
// a site-wide metric in the Poor band, a single page in the Poor band, and a
// metric that dropped a rating band across the last release. The issue is
// opened on the first finding, updated while anything is wrong, and closed once
// all three are clean. Guarded by a shared cron secret rather than a session,
// since a scheduler has no cookies.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorized =
    !!secret && request.headers.get("authorization") === `Bearer ${secret}`;
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [summaryResult, byPageResult, byVersionResult] = await Promise.all([
    fetchUpstream(`${API_URL}/api/vitals/summary`),
    fetchUpstream(`${API_URL}/api/vitals/by-page`),
    fetchUpstream(`${API_URL}/api/vitals/by-version`),
  ]);

  // The summary is the core signal. If it is missing we cannot run the
  // site-wide check at all, so fail rather than alert on partial data.
  const summary = await readSummary(summaryResult);
  if (summary === FAILED) {
    return NextResponse.json({ error: "Failed to fetch vitals" }, { status: 502 });
  }

  // by-page and by-version are secondary. A failure there leaves that section
  // empty and is logged, rather than taking the whole alert down over a metric
  // it could still report on.
  const byPage = await readList<PageVitals>(byPageResult, "byPage", "by-page");
  const byVersion = await readList<VersionMetrics>(
    byVersionResult,
    "byVersion",
    "by-version",
  );

  const report: AlertReport = {
    site: evaluateBreaches(summary),
    pages: evaluatePageBreaches(byPage),
    regressions: evaluateRegressions(byVersion),
  };
  const findings = {
    site: report.site.length,
    pages: report.pages.length,
    regressions: report.regressions.length,
  };

  const token = process.env.VITALS_ALERT_GITHUB_TOKEN;
  if (!token) {
    console.warn(
      "[vitals alert] VITALS_ALERT_GITHUB_TOKEN unset; not dispatching",
    );
    return NextResponse.json({ findings, dispatched: false });
  }

  const repo = process.env.GITHUB_REPOSITORY || DEFAULT_REPO;

  try {
    const existing = await findOpenIssue({
      repo,
      token,
      label: VITALS_ALERT_LABEL,
    });

    if (hasFindings(report)) {
      const body = alertIssueBody(report, { checkedAt: today() });
      if (existing) {
        await updateIssue({ repo, token, number: existing.number, body });
      } else {
        await createIssue({
          repo,
          token,
          title: VITALS_ALERT_TITLE,
          body,
          label: VITALS_ALERT_LABEL,
        });
      }
      return NextResponse.json({ findings, dispatched: true });
    }

    if (existing) {
      await closeIssue({
        repo,
        token,
        number: existing.number,
        comment: RECOVERY_COMMENT,
      });
      return NextResponse.json({ findings, dispatched: true, recovered: true });
    }

    return NextResponse.json({ findings, dispatched: false });
  } catch (err) {
    // A GitHub outage should not fail the cron. Report that we saw the findings
    // but could not dispatch, and let the next run try again.
    console.error("[vitals alert] GitHub dispatch failed:", err);
    return NextResponse.json({ findings, dispatched: false });
  }
}

/** Sentinel for an upstream call the alert cannot proceed without. */
const FAILED = Symbol("upstream-failed");

/** Reads the summary map, or FAILED when the call or its body is unusable. */
async function readSummary(
  result: UpstreamResult,
): Promise<Partial<Record<MetricName, { p75: number }>> | typeof FAILED> {
  if (!result.ok || !result.response.ok) return FAILED;
  try {
    const { summary } = (await result.response.json()) as {
      summary?: Partial<Record<MetricName, { p75: number }>>;
    };
    return summary ?? {};
  } catch (err) {
    console.error("[vitals alert] could not parse summary:", err);
    return FAILED;
  }
}

/** Reads a secondary list, degrading to [] (logged) on any failure. */
async function readList<T>(
  result: UpstreamResult,
  key: string,
  label: string,
): Promise<T[]> {
  if (!result.ok || !result.response.ok) {
    console.error(`[vitals alert] ${label} unavailable; skipping that section`);
    return [];
  }
  try {
    const data = (await result.response.json()) as Record<string, T[]>;
    return data[key] ?? [];
  } catch (err) {
    console.error(`[vitals alert] could not parse ${label}:`, err);
    return [];
  }
}

/** Today as an ISO date (YYYY-MM-DD), for the issue's "checked" line. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
