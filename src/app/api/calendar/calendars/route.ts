import { NextResponse, type NextRequest } from "next/server";
import { getBackendAuth, buildHeaders, API_URL } from "@/lib/backendFetch";

// GET /api/calendar/calendars
export async function GET() {
  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[calendars BFF] GET — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/api/calendar/calendars`, {
      headers: buildHeaders(token, email),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("[calendars BFF] GET — backend error:", body);
      return NextResponse.json({ error: "Failed to fetch calendars" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[calendars BFF] GET — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

// POST /api/calendar/calendars
export async function POST(request: NextRequest) {
  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[calendars BFF] POST — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const res = await fetch(`${API_URL}/api/calendar/calendars`, {
      method: "POST",
      headers: buildHeaders(token, email, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to create calendar" }));
      console.error("[calendars BFF] POST — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[calendars BFF] POST — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
