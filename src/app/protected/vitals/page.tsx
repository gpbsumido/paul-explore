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

async function fetchVitals(
  token: string,
  version: string | undefined,
): Promise<VitalsResponse> {
  const headers = { Authorization: `Bearer ${token}` };
  const query = version ? `?v=${encodeURIComponent(version)}` : "";

  const [summaryRes, byPageRes] = await Promise.all([
    fetch(`${API_URL}/api/vitals/summary${query}`, {
      headers,
      cache: "no-store",
    }),
    fetch(`${API_URL}/api/vitals/by-page${query}`, {
      headers,
      cache: "no-store",
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
    redirect("/api/auth/login");
  }

  const { v: urlVersion } = await searchParams;

  // fetch versions first to know what the latest is
  const [versions, byVersion] = await Promise.all([
    fetchVersions(token!),
    fetchByVersion(token!),
  ]);

  // "all" = explicit all-versions selection; no param = default to latest version
  const showAll = urlVersion === "all";
  const selectedVersion = showAll ? undefined : (urlVersion ?? versions[0]);

  const { summary, byPage } = await fetchVitals(token!, selectedVersion);

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
