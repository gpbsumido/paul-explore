import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// these match the whitelist in routes/vitals.js — kept in sync manually
// since the validation here is just a quick client-side gate before we
// even bother hitting the backend
const VALID_METRICS = new Set(["LCP", "CLS", "FCP", "INP", "TTFB"]);

// POST /api/vitals
// open ingestion — no session check, just validate the shape and forward
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { metric, value, rating, page } = body;

  if (!metric || value === undefined || value === null || !rating || !page) {
    return NextResponse.json(
      { error: "metric, value, rating, and page are required" },
      { status: 400 },
    );
  }

  if (typeof metric !== "string" || !VALID_METRICS.has(metric)) {
    return NextResponse.json(
      { error: `metric must be one of: ${[...VALID_METRICS].join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${API_URL}/api/vitals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: res.status });
  } catch (err) {
    console.error("[vitals BFF] POST — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

// GET /api/vitals
// fetches summary and by-page aggregates in parallel — auth required
export async function GET(request: NextRequest) {
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (err) {
    console.error("[vitals BFF] GET — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const headers = { Authorization: `Bearer ${token}` };
  const v = request.nextUrl.searchParams.get("v");
  const query = v ? `?v=${encodeURIComponent(v)}` : "";

  try {
    const [summaryRes, byPageRes] = await Promise.all([
      fetch(`${API_URL}/api/vitals/summary${query}`, { headers }),
      fetch(`${API_URL}/api/vitals/by-page${query}`, { headers }),
    ]);

    if (!summaryRes.ok || !byPageRes.ok) {
      const failedUrl = !summaryRes.ok ? "summary" : "by-page";
      console.error(`[vitals BFF] GET — backend error on ${failedUrl}`);
      return NextResponse.json(
        { error: "Failed to fetch vitals" },
        { status: 502 },
      );
    }

    const [{ summary }, { byPage }] = await Promise.all([
      summaryRes.json(),
      byPageRes.json(),
    ]);

    return NextResponse.json({ summary, byPage });
  } catch (err) {
    console.error("[vitals BFF] GET — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
