import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
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
  token: string,
  version: string | undefined,
  mode: string | undefined,
): Promise<VitalsResponse> {
  const headers = { Authorization: `Bearer ${token}` };
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
async function fetchVersions(token: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/vitals/versions`, {
      headers: { Authorization: `Bearer ${token}` },
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
  token: string,
  version: string | undefined,
  mode: string | undefined,
): Promise<VersionMetrics[]> {
  try {
    const params = new URLSearchParams();
    if (version) params.set("v", version);
    if (mode) params.set("mode", mode);
    const query = params.size > 0 ? `?${params.toString()}` : "";
    const res = await fetch(`${API_URL}/api/vitals/by-version${query}`, {
      headers: { Authorization: `Bearer ${token}` },
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
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch {
    redirect("/auth/login");
  }

  const { v: urlVersion } = await searchParams;

  // URL values use a prefix to encode the filter mode:
  //   "major:0"   → mode=major, v=0   (all 0.x.y versions)
  //   "minor:0.12" → mode=minor, v=0.12 (all 0.12.x versions)
  //   "0.11.3"    → no mode, exact match
  //   undefined   → no filter (defaults to "Current Major" in the selector)
  let filterMode: string | undefined;
  let filterVersion: string | undefined;

  if (urlVersion?.startsWith("major:")) {
    filterMode = "major";
    filterVersion = urlVersion.slice(6);
  } else if (urlVersion?.startsWith("minor:")) {
    filterMode = "minor";
    filterVersion = urlVersion.slice(6);
  } else if (urlVersion) {
    filterVersion = urlVersion;
  }

  const [versions, byVersion, { summary, byPage }] = await Promise.all([
    fetchVersions(token!),
    fetchByVersion(token!, filterVersion, filterMode),
    fetchVitals(token!, filterVersion, filterMode),
  ]);

  // the selector value mirrors the URL param; defaults to current major
  const defaultMajor = versions.length > 0 ? versions[0].split(".")[0] : "0";
  const selectedVersion = urlVersion ?? `major:${defaultMajor}`;

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
