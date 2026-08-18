import { NextResponse, type NextRequest } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";
import {
  evaluateBreaches,
  alertIssueBody,
  VITALS_ALERT_LABEL,
  VITALS_ALERT_TITLE,
} from "@/lib/vitalsAlert";
import {
  findOpenIssue,
  createIssue,
  updateIssue,
  closeIssue,
} from "@/lib/githubIssues";

const DEFAULT_REPO = "gpbsumido/paul-explore";
const RECOVERY_COMMENT = "All vitals are back within thresholds. Closing.";

// GET /api/vitals/alert
// The Web Vitals watchdog, run on a schedule by Vercel Cron. Reads the
// site-wide P75 summary, and turns any metric in the Poor band into a single
// GitHub issue: opened on the first breach, updated while it stays bad, closed
// on recovery. Guarded by a shared cron secret rather than a session, since a
// scheduler has no cookies.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorized =
    !!secret && request.headers.get("authorization") === `Bearer ${secret}`;
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchUpstream(`${API_URL}/api/vitals/summary`);
  if (!result.ok) return upstreamErrorResponse(result);
  if (!result.response.ok) {
    console.error(
      "[vitals alert] backend error on summary:",
      result.response.status,
    );
    return NextResponse.json({ error: "Failed to fetch vitals" }, { status: 502 });
  }

  let summary;
  try {
    ({ summary } = await result.response.json());
  } catch (err) {
    console.error("[vitals alert] could not parse summary:", err);
    return NextResponse.json({ error: "Failed to fetch vitals" }, { status: 502 });
  }

  const breaches = evaluateBreaches(summary ?? {});

  const token = process.env.VITALS_ALERT_GITHUB_TOKEN;
  if (!token) {
    console.warn(
      "[vitals alert] VITALS_ALERT_GITHUB_TOKEN unset; not dispatching",
    );
    return NextResponse.json({ breaches, dispatched: false });
  }

  const repo = process.env.GITHUB_REPOSITORY || DEFAULT_REPO;

  try {
    const existing = await findOpenIssue({
      repo,
      token,
      label: VITALS_ALERT_LABEL,
    });

    if (breaches.length > 0) {
      const body = alertIssueBody(breaches, { checkedAt: today() });
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
      return NextResponse.json({ breaches, dispatched: true });
    }

    if (existing) {
      await closeIssue({
        repo,
        token,
        number: existing.number,
        comment: RECOVERY_COMMENT,
      });
      return NextResponse.json({ breaches, dispatched: true, recovered: true });
    }

    return NextResponse.json({ breaches, dispatched: false });
  } catch (err) {
    // A GitHub outage should not fail the cron. Report that we saw the breaches
    // but could not dispatch, and let the next run try again.
    console.error("[vitals alert] GitHub dispatch failed:", err);
    return NextResponse.json({ breaches, dispatched: false });
  }
}

/** Today as an ISO date (YYYY-MM-DD), for the issue's "checked" line. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
