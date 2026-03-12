import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import type { VitalsResponse, VersionMetrics } from "@/types/vitals";
import VitalsContent from "./VitalsContent";

export const metadata: Metadata = {
  title: "Web Vitals | Dashboard",
  description:
    "Real-user Core Web Vitals collected from every page load, aggregated into P75 scores by metric and by page.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Fetches the global P75 summary and per-page breakdown from the backend.
 * Pass a version string to filter to rows from that version onwards, or
 * leave it undefined to get all-time aggregates.
 *
 * Uses revalidate: 60 instead of no-store because this data changes maybe a
 * few times a day at most, not per-request. Saves a backend round trip for
 * anyone who refreshes within the same minute.
 *
 * Note on the cache key: Next.js data cache keys fetch() by URL only, the
 * Authorization header is not included. That means two requests within 60s
 * could get the same cached backend response regardless of which token was
 * used. This is fine here because the vitals aggregates are site-wide P75
 * scores, not per-user data, so the response is the same for any authenticated
 * caller. Auth is still enforced at the page level via auth0.getAccessToken()
 * before this function is ever called.
 */
async function fetchVitals(
  token: string,
  version: string | undefined,
): Promise<VitalsResponse> {
  const headers = { Authorization: `Bearer ${token}` };
  const query = version ? `?v=${encodeURIComponent(version)}` : "";

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

  const { summary } = summaryRes.ok
    ? await summaryRes.json()
    : { summary: {} };

  const { byPage } = byPageRes.ok
    ? await byPageRes.json()
    : { byPage: [] };

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
 * Returns P75 per metric for the last 5 versions, oldest to newest.
 * This is what feeds the trend sparklines. Returns empty on any failure
 * so the chart section just doesn't render rather than crashing the page.
 */
async function fetchByVersion(token: string): Promise<VersionMetrics[]> {
  try {
    const res = await fetch(`${API_URL}/api/vitals/by-version`, {
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

  // "all" = user explicitly selected all versions, no param = show latest by default.
  // explicitVersion is what we actually pass to the backend -- undefined means no
  // version filter, which gives all-time aggregates.
  const showAll = urlVersion === "all";
  const explicitVersion = showAll ? undefined : urlVersion;

  // All three fetches run in parallel now. Previously fetchVitals had to wait
  // for fetchVersions to finish so we could pass versions[0] as the default.
  // Instead we pass explicitVersion directly (undefined when there's no param)
  // and derive selectedVersion from the versions result after everything resolves.
  const [versions, byVersion, { summary, byPage }] = await Promise.all([
    fetchVersions(token!),
    fetchByVersion(token!),
    fetchVitals(token!, explicitVersion),
  ]);

  // If no version was in the URL, default to the latest one for the selector UI.
  // The data itself is already all-time aggregates at this point, which is fine
  // since the user hasn't explicitly picked a version yet.
  const selectedVersion = explicitVersion ?? versions[0];

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
