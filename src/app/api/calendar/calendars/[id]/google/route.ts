import { NextResponse, type NextRequest } from "next/server";
import { getBackendAuth, buildHeaders, API_URL } from "@/lib/backendFetch";

// DELETE /api/calendar/calendars/:id/google
// Stops the Google Calendar watch channel and unlinks the Google Calendar from
// this calendar row. Does not delete the Google Calendar itself.
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
    console.error("[calendars BFF] DELETE google — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/api/calendar/calendars/${id}/google`, {
      method: "DELETE",
      headers: buildHeaders(token, email),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to disconnect Google Calendar" }));
      console.error("[calendars BFF] DELETE google — backend error:", err);
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[calendars BFF] DELETE google — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
