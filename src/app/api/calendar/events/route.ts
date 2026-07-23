import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { createEventBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";

// GET /api/calendar/events?start=<ISO>&end=<ISO>
export const GET = withBackend("calendar events GET", async ({ token, email }, request) => {
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const cardName = searchParams.get("cardName");
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  if (cardName) params.set("cardName", cardName);

  const res = await fetch(`${API_URL}/api/calendar/events?${params}`, {
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
  return NextResponse.json(await res.json());
});

// POST /api/calendar/events
export const POST = withBackend(
  "calendar events POST",
  async ({ token, email }, request) => {
    const bodyResult = await parseBody(request, createEventBodySchema);
    if (!bodyResult.ok) return bodyResult.response;

    const res = await fetch(`${API_URL}/api/calendar/events`, {
      method: "POST",
      headers: buildHeaders(token, email, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(bodyResult.data),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to create event" }));
      console.error("[calendar BFF] POST — backend error body:", err);
      return NextResponse.json(err, { status: res.status });
    }
    return NextResponse.json(await res.json(), { status: 201 });
  },
);
