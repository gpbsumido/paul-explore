import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import type { VitalsResponse } from "@/types/vitals";
import VitalsContent from "./VitalsContent";

export const metadata: Metadata = {
  title: "Web Vitals | Dashboard",
  description:
    "Real-user Core Web Vitals collected from every page load, aggregated into P75 scores by metric and by page.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Fetches both vitals aggregations in parallel and passes them down.
 * cache: "no-store" keeps the numbers fresh on every visit — these aren't
 * the kind of data you want served stale.
 */
async function fetchVitals(token: string): Promise<VitalsResponse> {
  const headers = { Authorization: `Bearer ${token}` };

  const [summaryRes, byPageRes] = await Promise.all([
    fetch(`${API_URL}/api/vitals/summary`, { headers, cache: "no-store" }),
    fetch(`${API_URL}/api/vitals/by-page`, { headers, cache: "no-store" }),
  ]);

  const { summary } = summaryRes.ok
    ? await summaryRes.json()
    : { summary: {} };

  const { byPage } = byPageRes.ok
    ? await byPageRes.json()
    : { byPage: [] };

  return { summary, byPage };
}

export default async function VitalsPage() {
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch {
    redirect("/api/auth/login");
  }

  const { summary, byPage } = await fetchVitals(token!);

  return <VitalsContent summary={summary} byPage={byPage} />;
}
