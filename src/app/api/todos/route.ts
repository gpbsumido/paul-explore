import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { parseBody } from "@/lib/parseBody";
import { createTodoBodySchema } from "@/lib/schemas";

/**
 * GET /api/todos
 *
 * Proxies the admin to-do list. The caller's own token goes upstream rather
 * than a service secret: the API re-checks that this person is the owner, so
 * the BFF vouching for them would just be a confused deputy.
 */
export const GET = withBackend("todos GET", async ({ token, email }) => {
  const upstreamResult = await fetchUpstream(`${API_URL}/api/todos`, {
    headers: buildHeaders(token, email),
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);

  const res = upstreamResult.response;
  if (!res.ok) {
    console.error("[todos BFF] GET — backend status:", res.status);
    return NextResponse.json(
      { error: "Failed to load todos" },
      { status: res.status },
    );
  }
  return NextResponse.json(await res.json());
});

/**
 * POST /api/todos
 *
 * Quick add. Same reasoning as the GET: the caller's own token goes upstream,
 * because the API re-checks that this person is the owner.
 */
export const POST = withBackend("todos POST", async ({ token, email }, request) => {
  const parsed = await parseBody(request, createTodoBodySchema);
  if (!parsed.ok) return parsed.response;

  const upstreamResult = await fetchUpstream(`${API_URL}/api/todos`, {
    method: "POST",
    headers: buildHeaders(token, email, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(parsed.data),
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);

  const res = upstreamResult.response;
  if (!res.ok) {
    console.error("[todos BFF] POST — backend status:", res.status);
    return NextResponse.json(
      { error: "Failed to add todo" },
      { status: res.status },
    );
  }
  return NextResponse.json(await res.json(), { status: 201 });
});
