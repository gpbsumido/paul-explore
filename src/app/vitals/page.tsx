import type { Metadata } from "next";
import { auth0 } from "@/lib/auth0";
import { resolveVitalsFilter } from "@/lib/vitalsFilter";
import type { VitalsResponse, VersionMetrics } from "@/types/vitals";
import VitalsContent from "./VitalsContent";

export const metadata: Metadata = {
  title: "Web Vitals",
  description:
    "Real-user Core Web Vitals collected from every page load, aggregated into P75 scores by metric and by page.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

/**
 * Returns the list of app versions that have vitals data, newest first.
 * Used to populate the version selector dropdown. Returns an empty array
 * if the backend doesn't have the endpoint yet so the selector just hides.
 */
async function fetchVersions(token: string | undefined): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/vitals/versions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const { versions } = await res.json();
    return versions ?? [];
  } catch {
    return [];
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
  const versions = await fetchVersions(token);
  const defaultMajor = versions.length > 0 ? versions[0].split(".")[0] : "0";
  const { filterMode, filterVersion, selectedVersion } = resolveVitalsFilter(
    urlVersion,
    defaultMajor,
  );

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
