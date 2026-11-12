import { NextResponse, type NextRequest } from "next/server";
import { isRoomCode, roomChannel } from "@/app/mind-reader/_room/protocol";

/**
 * POST /api/mind-reader/token
 *
 * Mints a short-lived Ably token for one Mind Reader room. It's the same idea
 * as /api/ably/token, kept separate so world presence's capability never
 * widens: this token can publish and subscribe on `mind-reader:<CODE>` and
 * nothing else, and the code is checked against the room-code pattern first so
 * a `*` or another feature's channel can't sneak into the capability.
 *
 * Returns 503 when no key is configured; the page falls back to a
 * BroadcastChannel and says the room only reaches tabs in this browser.
 */
export async function POST(request: NextRequest) {
  const key = process.env.ABLY_KEY;
  if (!key) {
    return NextResponse.json({ error: "Rooms not configured" }, { status: 503 });
  }

  let clientId: unknown;
  let room: unknown;
  try {
    const body = await request.json();
    clientId = body?.clientId;
    room = body?.room;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof clientId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }
  if (!isRoomCode(room)) {
    return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  }

  const { Rest } = await import("ably");
  const rest = new Rest({ key });

  try {
    const tokenRequest = await rest.auth.createTokenRequest({
      clientId,
      capability: { [roomChannel(room)]: ["publish", "subscribe"] },
      ttl: 60 * 60 * 1000,
    });
    return NextResponse.json(tokenRequest);
  } catch (err) {
    console.error("[mind-reader] token request failed:", err);
    return NextResponse.json({ error: "Rooms unavailable" }, { status: 502 });
  }
}
