import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { createCalendarBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";

// GET /api/calendar/calendars
export const GET = withBackend("calendars GET", async ({ token, email }) => {
  const res = await fetch(`${API_URL}/api/calendar/calendars`, {
    headers: buildHeaders(token, email),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    console.error("[calendars BFF] GET — backend error:", body);
    return NextResponse.json(
      { error: "Failed to fetch calendars" },
      { status: res.status },
    );
  }
  return NextResponse.json(await res.json());
});

// POST /api/calendar/calendars
export const POST = withBackend(
  "calendars POST",
  async ({ token, email }, request) => {
    const bodyResult = await parseBody(request, createCalendarBodySchema);
    if (!bodyResult.ok) return bodyResult.response;

    const res = await fetch(`${API_URL}/api/calendar/calendars`, {
      method: "POST",
      headers: buildHeaders(token, email, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(bodyResult.data),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to create calendar" }));
      console.error("[calendars BFF] POST — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    return NextResponse.json(await res.json(), { status: 201 });
  },
);
