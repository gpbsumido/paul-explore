import {
  parseRoomMessage,
  roomChannel,
  type Connect,
  type RoomMessage,
  type RoomTransport,
} from "./protocol";

// Two ways into a room, the same pair world presence uses (see
// src/app/world/presence/transport.ts). Ably when the token route has a key,
// so the two players can be anywhere; a BroadcastChannel otherwise, which only
// reaches tabs in this browser and is what CI and local dev run on.

const TOKEN_URL = "/api/mind-reader/token";

const newPeerId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const requestToken = (clientId: string, room: string) =>
  fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, room }),
  });

function connectLocal(code: string, onMessage: (m: RoomMessage) => void): RoomTransport {
  const channel = new BroadcastChannel(roomChannel(code));
  channel.onmessage = (event: MessageEvent) => {
    const message = parseRoomMessage(event.data);
    if (message) onMessage(message);
  };
  return {
    kind: "local",
    send: (message) => channel.postMessage(message),
    close: () => channel.close(),
  };
}

/**
 * Asks the token route first, so a missing key falls straight back to the
 * local channel instead of waiting out Ably's connection retries. The SDK is
 * imported here so it never lands in the bundle for a one-device game.
 */
async function connectAbly(
  code: string,
  onMessage: (m: RoomMessage) => void,
): Promise<RoomTransport | null> {
  const clientId = newPeerId();
  try {
    const probe = await requestToken(clientId, code);
    if (!probe.ok) return null;

    const { Realtime } = await import("ably");
    const client = new Realtime({
      clientId,
      echoMessages: false,
      authCallback: (_params, callback) => {
        requestToken(clientId, code)
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
          .then((token) => callback(null, token), (err: Error) => callback(err.message, null));
      },
    });
    const channel = client.channels.get(roomChannel(code));
    await channel.subscribe("m", (message) => {
      const parsed = parseRoomMessage(message.data);
      if (parsed) onMessage(parsed);
    });
    return {
      kind: "ably",
      send: (message) => void channel.publish("m", message),
      close: () => client.close(),
    };
  } catch {
    return null;
  }
}

/** Joins a room over Ably if it's configured, otherwise over this browser's tabs. */
export const connectRoom: Connect = async (code, onMessage) =>
  (await connectAbly(code, onMessage)) ?? connectLocal(code, onMessage);
