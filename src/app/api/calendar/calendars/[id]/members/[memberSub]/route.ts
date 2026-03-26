import { NextResponse, type NextRequest } from "next/server";
import { getBackendAuth, buildHeaders, API_URL } from "@/lib/backendFetch";
import { updateMemberRoleBodySchema } from "@/lib/schemas";

/** PUT /api/calendar/calendars/:id/members/:memberSub — body: { role } → { member } */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberSub: string }> },
) {
  // Next.js decodes dynamic segments automatically — use as-is when forwarding
  const { id, memberSub } = await params;

  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[members BFF] PUT — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const raw = await request.json();
  const parsed = updateMemberRoleBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.issues }, { status: 400 });
  }
  const body = parsed.data;

  try {
    const res = await fetch(
      `${API_URL}/api/calendar/calendars/${id}/members/${encodeURIComponent(memberSub)}`,
      {
        method: "PUT",
        headers: buildHeaders(token, email, { "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to update member role" }));
      return NextResponse.json(err, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    console.error("[members BFF] PUT — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

/**
 * DELETE /api/calendar/calendars/:id/members/:memberSub
 * Backend returns 200 { googleAclRemoved: boolean } — forward it so the
 * frontend can warn when Google access was not successfully revoked.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberSub: string }> },
) {
  const { id, memberSub } = await params;

  let token: string;
  let email: string | null;
  try {
    ({ token, email } = await getBackendAuth());
  } catch (err) {
    console.error("[members BFF] DELETE — getAccessToken failed:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${API_URL}/api/calendar/calendars/${id}/members/${encodeURIComponent(memberSub)}`,
      {
        method: "DELETE",
        headers: buildHeaders(token, email),
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to remove member" }));
      return NextResponse.json(err, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    console.error("[members BFF] DELETE — fetch threw:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
