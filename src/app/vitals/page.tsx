import type { Metadata } from "next";
import { API_URL } from "@/lib/apiUrl";
import { auth0 } from "@/lib/auth0";
import { fetchUpstream } from "@/lib/upstream";
import { resolveVitalsFilter } from "@/lib/vitalsFilter";
import type { VitalsResponse, VersionMetrics } from "@/types/vitals";
import VitalsContent from "./VitalsContent";

export const metadata: Metadata = {
  title: "Web Vitals",
  description:
    "Real-user Core Web Vitals collected from every page load, aggregated into P75 scores by metric and by page.",
};

/**
 * Fetches the global P75 summary and per-page breakdown from the backend.
 * Pass version + mode to filter: mode=major/minor scopes to that range,
 * no mode = exact version match. Undefined version = all-time aggregates.
 *
 * Uses revalidate: 60 because vitals data changes at most a few times a day.
 *
 * Note on the cache key: Next.js keys fetch() by URL only, so two requests
 * within 60s may share a cached response regardless of token. That's fine
 * here because vitals aggregates are site-wide, not per-user.
 */
async function fetchVitals(
  token: string | undefined,
  version: string | undefined,
  mode: string | undefined,
): Promise<VitalsResponse> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const params = new URLSearchParams();
  if (version) params.set("v", version);
  if (mode) params.set("mode", mode);
  const query = params.size > 0 ? `?${params.toString()}` : "";

  const [summaryRes, byPageRes] = await Promise.all([
    fetch(`${API_URL}/api/vitals/summary${query}`, {
      headers,
      next: { revalidate: 60 },
    }),
    fetch(`${API_URL}/api/vitals/by-page${query}`, {
      headers,
      next: { revalidate: 60 },
    }),
  ]);

  const { summary } = summaryRes.ok ? await summaryRes.json() : { summary: {} };

  const { byPage } = byPageRes.ok ? await byPageRes.json() : { byPage: [] };

  return { summary, byPage };
}

type VersionsResult =
  | { reachable: true; versions: string[] }
  | { reachable: false };

/**
 * Returns the list of app versions that have vitals data, newest first, and
 * doubles as the page's health probe.
 *
 * This call runs before the other three, so whether it got an answer is the
 * cheapest way to know if the backend is up. It used to swallow everything and
 * return [], which sent the page off to query version "0" and render the empty
 * state -- an outage shown as a report of zero traffic.
 *
 * A transport failure or a 5xx means down. Anything the backend actually said
 * (a 404 from a deploy that doesn't have the endpoint yet, most of all) is
 * reachable with no versions, so the selector just hides as before.
 */
async function fetchVersions(
  token: string | undefined,
): Promise<VersionsResult> {
  const result = await fetchUpstream(`${API_URL}/api/vitals/versions`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  if (!result.ok) return { reachable: false };

  const res = result.response;
  if (res.status >= 500) return { reachable: false };
  if (!res.ok) return { reachable: true, versions: [] };

  try {
    const { versions } = await res.json();
    return { reachable: true, versions: versions ?? [] };
  } catch {
    return { reachable: true, versions: [] };
  }
}

/**
 * Returns P75 per metric for recent versions, oldest to newest.
 * Accepts the same version/mode pair as fetchVitals so the chart scope
 * matches the selected filter. Returns empty on failure so the chart
 * section just hides rather than crashing the page.
 */
async function fetchByVersion(
  token: string | undefined,
  version: string | undefined,
  mode: string | undefined,
): Promise<VersionMetrics[]> {
  try {
    const params = new URLSearchParams();
    if (version) params.set("v", version);
    if (mode) params.set("mode", mode);
    const query = params.size > 0 ? `?${params.toString()}` : "";
    const res = await fetch(`${API_URL}/api/vitals/by-version${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const { byVersion } = await res.json();
    return byVersion ?? [];
  } catch {
    return [];
  }
}

export default async function VitalsPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  // Web Vitals is public. Forward the visitor's token when they have one so a
  // signed-in request stays authenticated, but a signed-out visitor is not
  // redirected — getAccessToken throws with no session, so it degrades to an
  // anonymous request and the fetches fall back to empty data.
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch {
    token = undefined;
  }

  const { v: urlVersion } = await searchParams;

  // Resolve which versions to show first, because the default scope depends on
  // the current major. Fetching versions up front lets first load (no ?v) query
  // the same current-major scope the selector displays, so the numbers don't
  // change when you pick "Current Major" back after switching away.
  const result = await fetchVersions(token);

  // Backend down. Say so instead of scoping the next three calls to a version
  // that doesn't exist and calling the nothing that comes back "no data yet".
  if (!result.reachable) {
    return (
      <VitalsContent
        unreachable
        summary={{}}
        byPage={[]}
        versions={[]}
        selectedVersion=""
        byVersion={[]}
      />
    );
  }

  const { versions } = result;

  // A reachable backend with no recorded versions is a fresh database, and a
  // fresh database has no current major to scope to. Skip the version filter
  // entirely so the queries ask for all-time data instead of inventing a
  // major "0" that never shipped. The selector renders nothing without
  // versions, so an empty selectedVersion never reaches a control.
  const { filterMode, filterVersion, selectedVersion } =
    versions.length > 0
      ? resolveVitalsFilter(urlVersion, versions[0].split(".")[0])
      : {
          filterMode: undefined,
          filterVersion: undefined,
          selectedVersion: "",
        };

  const [byVersion, { summary, byPage }] = await Promise.all([
    fetchByVersion(token, filterVersion, filterMode),
    fetchVitals(token, filterVersion, filterMode),
  ]);

  return (
    <VitalsContent
      summary={summary}
      byPage={byPage}
      versions={versions}
      selectedVersion={selectedVersion}
      byVersion={byVersion}
    />
  );
}
