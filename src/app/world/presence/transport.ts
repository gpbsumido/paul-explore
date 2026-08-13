import {
  presenceMessageSchema,
  PRESENCE_ROOM,
  type PresenceMessage,
  type PresenceSnapshot,
} from "@/lib/world/presence";

// Two ways onto the same wire. Ably when a key is configured (real cross-user
// presence); BroadcastChannel otherwise (live between this browser's own tabs,
// free, offline, and the permanent fallback). Every inbound message is parsed
// against the zod wire schema — junk and echoes are dropped at the door.

export type PresenceTransport = {
  readonly kind: "local" | "ably";
  publish(snap: PresenceSnapshot): void;
  close(): void;
};

type MessageHandler = (message: PresenceMessage) => void;

const CHANNEL_NAME = `presence:${PRESENCE_ROOM}`;

/** Same-browser presence over BroadcastChannel. Null where unsupported. */
export function createLocalTransport(
  peerId: string,
  onMessage: MessageHandler,
): PresenceTransport | null {
  if (typeof BroadcastChannel === "undefined") return null;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent) => {
    const parsed = presenceMessageSchema.safeParse(event.data);
    if (!parsed.success || parsed.data.peerId === peerId) return;
    onMessage(parsed.data);
  };
  return {
    kind: "local",
    publish(snap) {
      channel.postMessage({ peerId, snap } satisfies PresenceMessage);
    },
    close() {
      channel.close();
    },
  };
}

/**
 * Cross-user presence over an Ably channel. The SDK loads lazily so it never
 * touches the bundle unless presence is actually used; any setup failure --
 * including the token route reporting that no key is configured -- returns
 * null and the caller falls back to the local transport.
 */
export async function createAblyTransport(
  peerId: string,
  onMessage: MessageHandler,
): Promise<PresenceTransport | null> {
  try {
    const { Realtime } = await import("ably");
    // authUrl, never a key. new Realtime({ key }) is basic auth from the
    // browser, and the key would have to reach the browser to get here --
    // which means shipping appId.keyId:keySecret in the bundle. The route
    // mints a token scoped to this one channel, for an hour.
    const client = new Realtime({
      authUrl: "/api/ably/token",
      authMethod: "POST",
      authHeaders: { "Content-Type": "application/json" },
      authParams: { clientId: peerId },
      clientId: peerId,
    });
    const channel = client.channels.get(CHANNEL_NAME);
    await channel.subscribe("s", (message) => {
      const parsed = presenceMessageSchema.safeParse({
        peerId: message.clientId ?? "",
        snap: message.data,
      });
      if (!parsed.success || parsed.data.peerId === peerId) return;
      onMessage(parsed.data);
    });
    return {
      kind: "ably",
      publish(snap) {
        void channel.publish("s", snap);
      },
      close() {
        client.close();
      },
    };
  } catch {
    return null;
  }
}
