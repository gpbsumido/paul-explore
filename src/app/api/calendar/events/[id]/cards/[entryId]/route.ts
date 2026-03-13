import { NextResponse, type NextRequest } from "next/server";
import { getBackendAuth, buildHeaders, API_URL } from "@/lib/backendFetch";

// PUT /api/calendar/events/:id/cards/:entryId
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  const { id, entryId } = await params;

  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[calendar BFF] PUT card — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const res = await fetch(
      `${API_URL}/api/calendar/events/${id}/cards/${entryId}`,
      {
        method: "PUT",
        headers: buildHeaders(token, email, { "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to update card" }));
      console.error("[calendar BFF] PUT card — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[calendar BFF] PUT card — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

// DELETE /api/calendar/events/:id/cards/:entryId
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  const { id, entryId } = await params;

  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[calendar BFF] DELETE card — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${API_URL}/api/calendar/events/${id}/cards/${entryId}`,
      {
        method: "DELETE",
        headers: buildHeaders(token, email),
      },
    );
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to delete card" }));
      console.error("[calendar BFF] DELETE card — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[calendar BFF] DELETE card — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
