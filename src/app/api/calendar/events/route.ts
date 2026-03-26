import { NextResponse, type NextRequest } from "next/server";
import { getBackendAuth, buildHeaders, API_URL } from "@/lib/backendFetch";
import { createEventBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";

// GET /api/calendar/events?start=<ISO>&end=<ISO>
export async function GET(request: NextRequest) {
  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[calendar BFF] GET — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const cardName = searchParams.get("cardName");
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  if (cardName) params.set("cardName", cardName);

  const backendUrl = `${API_URL}/api/calendar/events?${params}`;

  try {
    const res = await fetch(backendUrl, {
      headers: buildHeaders(token, email),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("[calendar BFF] GET — backend error body:", body);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[calendar BFF] GET — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

// POST /api/calendar/events
export async function POST(request: NextRequest) {
  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[calendar BFF] POST — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const bodyResult = await parseBody(request, createEventBodySchema);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  try {
    const res = await fetch(`${API_URL}/api/calendar/events`, {
      method: "POST",
      headers: buildHeaders(token, email, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to create event" }));
      console.error("[calendar BFF] POST — backend error body:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[calendar BFF] POST — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
