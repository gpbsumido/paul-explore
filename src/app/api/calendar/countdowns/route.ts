import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// GET /api/calendar/countdowns?cursor=<cursor>
// returns one page of countdowns sorted by target date ascending.
// forwards the cursor query param to the backend unchanged.
export async function GET(request: NextRequest) {
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (err) {
    console.error("[countdowns BFF] GET — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const backendUrl = cursor
    ? `${API_URL}/api/calendar/countdowns?cursor=${encodeURIComponent(cursor)}`
    : `${API_URL}/api/calendar/countdowns`;

  try {
    const res = await fetch(backendUrl, {
      headers: { Authorization: `Bearer ${token}` },
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
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (err) {
    console.error("[countdowns BFF] POST — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const res = await fetch(`${API_URL}/api/calendar/countdowns`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
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
