import { describe, it, expect, vi, afterEach } from "vitest";
import type { PresenceSnapshot } from "@/lib/world/presence";
import { createLocalTransport } from "./transport";

const SNAP: PresenceSnapshot = {
  x: 1,
  z: 2,
  heading: 0.5,
  outfitId: "raptors",
  name: "Curious Raccoon",
};

/** Every channel opened, so a test can deliver a message to one or read what it sent. */
const channels: FakeBroadcastChannel[] = [];

class FakeBroadcastChannel {
  onmessage: ((event: MessageEvent) => void) | null = null;
  posted: unknown[] = [];
  closed = false;

  constructor(public readonly name: string) {
    channels.push(this);
  }

  postMessage(data: unknown) {
    this.posted.push(data);
  }

  close() {
    this.closed = true;
  }

  /** What another tab sending this would look like. */
  receive(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

afterEach(() => {
  channels.length = 0;
  vi.unstubAllGlobals();
  vi.doUnmock("ably");
  vi.resetModules();
});

describe("local presence transport", () => {
  it("is not available where BroadcastChannel is missing", () => {
    vi.stubGlobal("BroadcastChannel", undefined);

    expect(createLocalTransport("me", () => {})).toBeNull();
  });

  it("publishes this explorer's pose tagged with its own id", () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
    const transport = createLocalTransport("me", () => {});

    transport?.publish(SNAP);

    expect(transport?.kind).toBe("local");
    expect(channels[0].posted).toEqual([{ peerId: "me", snap: SNAP }]);
  });

  it("hands another explorer's pose to the listener", () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
    const onMessage = vi.fn();
    createLocalTransport("me", onMessage);

    channels[0].receive({ peerId: "someone-else", snap: SNAP });

    expect(onMessage).toHaveBeenCalledWith({ peerId: "someone-else", snap: SNAP });
  });

  it("drops its own echo", () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
    const onMessage = vi.fn();
    createLocalTransport("me", onMessage);

    channels[0].receive({ peerId: "me", snap: SNAP });

    expect(onMessage).not.toHaveBeenCalled();
  });

  it.each([
    ["a string", "hello"],
    ["no pose", { peerId: "x" }],
    ["a non-finite coordinate", { peerId: "x", snap: { ...SNAP, x: Number.POSITIVE_INFINITY } }],
    ["an oversized name", { peerId: "x", snap: { ...SNAP, name: "n".repeat(25) } }],
    ["an empty peer id", { peerId: "", snap: SNAP }],
  ])("drops a message that is %s", (_label, data) => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
    const onMessage = vi.fn();
    createLocalTransport("me", onMessage);

    channels[0].receive(data);

    expect(onMessage).not.toHaveBeenCalled();
  });

  it("closes the channel when asked", () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
    const transport = createLocalTransport("me", () => {});

    transport?.close();

    expect(channels[0].closed).toBe(true);
  });
});

describe("ably presence transport", () => {
  it("returns null, so the caller falls back to the local one, when the SDK will not load", async () => {
    vi.doMock("ably", () => {
      throw new Error("not installed");
    });
    const { createAblyTransport: create } = await import("./transport");

    await expect(create("me", () => {})).resolves.toBeNull();
  });

  it("returns null when the token route says no key is configured", async () => {
    vi.doMock("ably", () => ({
      Realtime: class {
        channels = {
          get: () => ({
            subscribe: () => Promise.reject(new Error("no key configured")),
          }),
        };
      },
    }));
    const { createAblyTransport: create } = await import("./transport");

    await expect(create("me", () => {})).resolves.toBeNull();
  });

  it("subscribes with a token URL, never a key, and relays other explorers' poses", async () => {
    const options: unknown[] = [];
    let deliver: (message: { clientId?: string; data: unknown }) => void = () => {};
    const published: unknown[] = [];
    let closed = false;
    vi.doMock("ably", () => ({
      Realtime: class {
        constructor(config: unknown) {
          options.push(config);
        }
        channels = {
          get: () => ({
            subscribe: async (_name: string, listener: typeof deliver) => {
              deliver = listener;
            },
            publish: async (name: string, data: unknown) => {
              published.push([name, data]);
            },
          }),
        };
        close() {
          closed = true;
        }
      },
    }));
    const { createAblyTransport: create } = await import("./transport");
    const onMessage = vi.fn();

    const transport = await create("me", onMessage);

    expect(transport?.kind).toBe("ably");
    expect(options[0]).toMatchObject({ authUrl: "/api/ably/token", clientId: "me" });
    expect(options[0]).not.toHaveProperty("key");

    deliver({ clientId: "peer-1", data: SNAP });
    expect(onMessage).toHaveBeenCalledWith({ peerId: "peer-1", snap: SNAP });

    deliver({ clientId: "me", data: SNAP });
    deliver({ data: SNAP });
    deliver({ clientId: "peer-2", data: { nonsense: true } });
    expect(onMessage).toHaveBeenCalledTimes(1);

    transport?.publish(SNAP);
    expect(published).toEqual([["s", SNAP]]);
    transport?.close();
    expect(closed).toBe(true);
  });
});
