import { NextResponse, type NextRequest } from "next/server";
import { getBackendAuth, buildHeaders, API_URL } from "@/lib/backendFetch";
import { createCountdownBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";

// GET /api/calendar/countdowns?cursor=<cursor>
// returns one page of countdowns sorted by target date ascending.
// forwards the cursor query param to the backend unchanged.
export async function GET(request: NextRequest) {
  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[countdowns BFF] GET — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");

  if (cursor !== null && !/^[\w+/=\-]{1,512}$/.test(cursor)) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

  const backendUrl = cursor
    ? `${API_URL}/api/calendar/countdowns?cursor=${encodeURIComponent(cursor)}`
    : `${API_URL}/api/calendar/countdowns`;

  try {
    const res = await fetch(backendUrl, {
      headers: buildHeaders(token, email),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("[countdowns BFF] GET — backend error:", body);
      return NextResponse.json(
        { error: "Failed to fetch countdowns" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[countdowns BFF] GET — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

// POST /api/calendar/countdowns
// body: { title, description?, targetDate, color }
export async function POST(request: NextRequest) {
  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[countdowns BFF] POST — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const bodyResult = await parseBody(request, createCountdownBodySchema);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  try {
    const res = await fetch(`${API_URL}/api/calendar/countdowns`, {
      method: "POST",
      headers: buildHeaders(token, email, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to create countdown" }));
      console.error("[countdowns BFF] POST — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[countdowns BFF] POST — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
