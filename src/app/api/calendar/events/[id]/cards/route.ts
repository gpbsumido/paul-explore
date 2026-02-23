import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// GET /api/calendar/events/:id/cards
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (err) {
    console.error("[calendar BFF] GET cards — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/api/calendar/events/${id}/cards`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("[calendar BFF] GET cards — backend error:", body);
      return NextResponse.json(
        { error: "Failed to fetch cards" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[calendar BFF] GET cards — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

// POST /api/calendar/events/:id/cards
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch (err) {
    console.error("[calendar BFF] POST cards — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const res = await fetch(`${API_URL}/api/calendar/events/${id}/cards`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to add card" }));
      console.error("[calendar BFF] POST cards — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[calendar BFF] POST cards — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
