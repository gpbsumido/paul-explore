import { NextResponse, type NextRequest } from "next/server";
import { getBackendAuth, buildHeaders, API_URL } from "@/lib/backendFetch";

/** GET /api/calendar/calendars/:id/members — returns { members: [...] } */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[members BFF] GET — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/api/calendar/calendars/${id}/members`, {
      headers: buildHeaders(token, email),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to fetch members" }));
      return NextResponse.json(err, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    console.error("[members BFF] GET — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

/** POST /api/calendar/calendars/:id/members — body: { email, role? } → 201 { member } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[members BFF] POST — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const res = await fetch(`${API_URL}/api/calendar/calendars/${id}/members`, {
      method: "POST",
      headers: buildHeaders(token, email, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to invite member" }));
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[members BFF] POST — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
