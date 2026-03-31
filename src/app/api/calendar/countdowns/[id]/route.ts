import { NextResponse, type NextRequest } from "next/server";
import { getBackendAuth, buildHeaders, API_URL } from "@/lib/backendFetch";
import { updateCountdownBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";

// GET /api/calendar/countdowns/:id
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
    console.error("[countdowns BFF] GET by id — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/api/calendar/countdowns/${id}`, {
      headers: buildHeaders(token, email),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("[countdowns BFF] GET by id — backend error:", body);
      return NextResponse.json(
        { error: "Failed to fetch countdown" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[countdowns BFF] GET by id — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

// PUT /api/calendar/countdowns/:id
// partial update, only the fields you pass get changed
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[countdowns BFF] PUT — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const bodyResult = await parseBody(request, updateCountdownBodySchema);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  try {
    const res = await fetch(`${API_URL}/api/calendar/countdowns/${id}`, {
      method: "PUT",
      headers: buildHeaders(token, email, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to update countdown" }));
      console.error("[countdowns BFF] PUT — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[countdowns BFF] PUT — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

// DELETE /api/calendar/countdowns/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[countdowns BFF] DELETE — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/api/calendar/countdowns/${id}`, {
      method: "DELETE",
      headers: buildHeaders(token, email),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to delete countdown" }));
      console.error("[countdowns BFF] DELETE — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[countdowns BFF] DELETE — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
