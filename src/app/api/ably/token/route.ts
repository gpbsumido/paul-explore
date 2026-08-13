import { NextResponse, type NextRequest } from "next/server";
import { PRESENCE_ROOM } from "@/lib/world/presence";

/**
 * POST /api/ably/token
 *
 * Mints a short-lived, channel-scoped Ably token for the world presence
 * feature.
 *
 * The browser used to be handed the Ably API key directly. That key is a
 * secret of the form appId.keyId:keySecret, and anything prefixed
 * NEXT_PUBLIC_ is inlined into the client bundle at build time, so it would
 * have been readable by every visitor -- and an Ably app key carries publish,
 * subscribe, presence and history on channel scope `*` unless it is
 * provisioned narrower. A token request keeps the key on the server and gives
 * the browser only what this feature needs, for an hour.
 *
 * Returns 503 rather than an error when no key is configured: the presence
 * feature is optional and the caller already falls back to a local transport.
 */
export async function POST(request: NextRequest) {
  const key = process.env.ABLY_KEY;
  if (!key) {
    return NextResponse.json({ error: "Presence not configured" }, { status: 503 });
  }

  let clientId: string;
  try {
    const body = await request.json();
    clientId = typeof body?.clientId === "string" ? body.clientId : "";
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // The peer id is a client-generated handle, not an identity — it only scopes
  // the token to one connection, so bound its shape rather than trusting it.
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

  const { Rest } = await import("ably");
  const rest = new Rest({ key });

  try {
    const tokenRequest = await rest.auth.createTokenRequest({
      clientId,
      capability: {
        [`presence:${PRESENCE_ROOM}`]: ["publish", "subscribe", "presence"],
      },
      ttl: 60 * 60 * 1000,
    });
    return NextResponse.json(tokenRequest);
  } catch (err) {
    console.error("[ably] token request failed:", err);
    return NextResponse.json({ error: "Presence unavailable" }, { status: 502 });
  }
}
