import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import type { PresenceSnapshot } from "@/lib/world/presence";
import { buildEnvironmentConfig, buildFlag, fullRollout } from "@/test/factories/flags";
import type { PlayerSnapshot } from "../refs";
import type { PresenceTransport } from "./transport";

type Handler = (message: { peerId: string; snap: PresenceSnapshot }) => void;

const wire = vi.hoisted(() => ({
  ably: null as PresenceTransport | null,
  local: null as PresenceTransport | null,
  deliver: (() => {}) as Handler,
  ablyAsked: 0,
  localAsked: 0,
  /** When set, the cross-user transport does not answer until this settles. */
  ablyGate: null as Promise<void> | null,
}));

// The transports have their own tests. Here they are two doors the hook can
// walk through, and a way to push messages in from "another explorer".
vi.mock("./transport", () => ({
  createAblyTransport: async (_peerId: string, onMessage: Handler) => {
    wire.ablyAsked += 1;
    await wire.ablyGate;
    if (wire.ably) wire.deliver = onMessage;
    return wire.ably;
  },
  createLocalTransport: (_peerId: string, onMessage: Handler) => {
    wire.localAsked += 1;
    if (wire.local) wire.deliver = onMessage;
    return wire.local;
  },
}));

import { useWorldPresence } from "./useWorldPresence";

const transportOf = (kind: "local" | "ably") => {
  const published: PresenceSnapshot[] = [];
  let closed = 0;
  const transport: PresenceTransport = {
    kind,
    publish: (snap) => {
      published.push(snap);
    },
    close: () => {
      closed += 1;
    },
  };
  return { transport, published, closed: () => closed };
};

const snapOf = (over: Partial<PresenceSnapshot> = {}): PresenceSnapshot => ({
  x: 3,
  z: 4,
  heading: 1,
  outfitId: "raptors",
  name: "Streetcar Fox",
  ...over,
});

/** One stable ref, as the real HUD keeps: a new object each render would restart the hook. */
const player = (over: Partial<PlayerSnapshot> = {}) => ({
  current: { x: 10, z: 20, heading: 0.5, ...over } satisfies PlayerSnapshot,
});

beforeEach(() => {
  wire.ably = null;
  wire.local = null;
  wire.deliver = () => {};
  wire.ablyAsked = 0;
  wire.localAsked = 0;
  wire.ablyGate = null;
  server.use(http.get("/api/flags", () => HttpResponse.json({ flags: [] })));
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
});

afterEach(() => {
  vi.useRealTimers();
});

/** Lets the hook's async set-up (flag check, transport) finish. */
const settle = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();
  });
};

describe("useWorldPresence set-up", () => {
  it("does nothing while disabled", async () => {
    const playerRef = player();
    wire.local = transportOf("local").transport;
    renderHook(() => useWorldPresence({ enabled: false, playerRef, outfitId: "raptors" }));
    await settle();

    expect(wire.ablyAsked).toBe(0);
    expect(wire.localAsked).toBe(0);
  });

  it("prefers the cross-user transport when it is available", async () => {
    const playerRef = player();
    wire.ably = transportOf("ably").transport;
    wire.local = transportOf("local").transport;
    renderHook(() => useWorldPresence({ enabled: true, playerRef, outfitId: "raptors" }));
    await settle();

    expect(wire.ablyAsked).toBe(1);
    expect(wire.localAsked).toBe(0);
  });

  it("falls back to the same-browser transport when the cross-user one is not available", async () => {
    const playerRef = player();
    wire.local = transportOf("local").transport;
    renderHook(() => useWorldPresence({ enabled: true, playerRef, outfitId: "raptors" }));
    await settle();

    expect(wire.ablyAsked).toBe(1);
    expect(wire.localAsked).toBe(1);
  });

  it("carries on, with presence, when the flag service errors or has no such flag", async () => {
    const playerRef = player();
    server.use(http.get("/api/flags", () => new HttpResponse(null, { status: 500 })));
    wire.local = transportOf("local").transport;
    renderHook(() => useWorldPresence({ enabled: true, playerRef, outfitId: "raptors" }));
    await settle();
    expect(wire.localAsked).toBe(1);

    server.use(http.get("/api/flags", () => HttpResponse.json({ flags: [] })));
    renderHook(() => useWorldPresence({ enabled: true, playerRef, outfitId: "raptors" }));
    await settle();
    expect(wire.localAsked).toBe(2);
  });

  /** A kill-switch state for the presence flag, served to everyone in production. */
  const presenceFlag = (on: boolean) =>
    buildFlag({
      key: "world-live-presence",
      environments: {
        development: buildEnvironmentConfig(),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig({
          fallthrough: fullRollout(on ? "on" : "off"),
        }),
      },
    });

  it("stays off when the world-live-presence flag is switched off", async () => {
    server.use(
      http.get("/api/flags", () => HttpResponse.json({ flags: [presenceFlag(false)] })),
    );
    const playerRef = player();
    wire.local = transportOf("local").transport;
    renderHook(() => useWorldPresence({ enabled: true, playerRef, outfitId: "raptors" }));
    await settle();

    expect(wire.ablyAsked).toBe(0);
    expect(wire.localAsked).toBe(0);
  });

  it("goes ahead when the world-live-presence flag is switched on", async () => {
    server.use(
      http.get("/api/flags", () => HttpResponse.json({ flags: [presenceFlag(true)] })),
    );
    const playerRef = player();
    wire.local = transportOf("local").transport;
    renderHook(() => useWorldPresence({ enabled: true, playerRef, outfitId: "raptors" }));
    await settle();

    expect(wire.localAsked).toBe(1);
  });

  it("carries on when the flag request cannot be made at all, or the answer is not a flag list", async () => {
    const playerRef = player();
    wire.local = transportOf("local").transport;
    server.use(http.get("/api/flags", () => HttpResponse.error()));
    renderHook(() => useWorldPresence({ enabled: true, playerRef, outfitId: "raptors" }));
    await settle();
    expect(wire.localAsked).toBe(1);

    server.use(http.get("/api/flags", () => HttpResponse.json({ nonsense: true })));
    renderHook(() => useWorldPresence({ enabled: true, playerRef, outfitId: "raptors" }));
    await settle();
    expect(wire.localAsked).toBe(2);
  });

  it("closes a transport that finished connecting after the world had already gone", async () => {
    const ably = transportOf("ably");
    wire.ably = ably.transport;
    let finishConnecting: () => void = () => {};
    wire.ablyGate = new Promise<void>((resolve) => {
      finishConnecting = resolve;
    });
    const playerRef = player();
    const { unmount } = renderHook(() =>
      useWorldPresence({ enabled: true, playerRef, outfitId: "raptors" }),
    );
    await settle();
    expect(wire.ablyAsked).toBe(1);

    unmount();
    finishConnecting();
    await settle();

    expect(ably.closed()).toBe(1);
    expect(ably.published).toEqual([]);
  });

  it("does not even ask for a transport when the world went away during the flag check", async () => {
    wire.local = transportOf("local").transport;
    let answerFlags: () => void = () => {};
    server.use(
      http.get("/api/flags", async () => {
        await new Promise<void>((resolve) => {
          answerFlags = resolve;
        });
        return HttpResponse.json({ flags: [] });
      }),
    );
    const playerRef = player();
    const { unmount } = renderHook(() =>
      useWorldPresence({ enabled: true, playerRef, outfitId: "raptors" }),
    );
    await settle();

    unmount();
    answerFlags();
    await settle();

    expect(wire.ablyAsked).toBe(0);
    expect(wire.localAsked).toBe(0);
  });

  it("closes the transport when the world goes away", async () => {
    const playerRef = player();
    const local = transportOf("local");
    wire.local = local.transport;
    const { unmount } = renderHook(() =>
      useWorldPresence({ enabled: true, playerRef, outfitId: "raptors" }),
    );
    await settle();

    unmount();

    expect(local.closed()).toBe(1);
  });
});

describe("useWorldPresence publishing", () => {
  it("publishes this explorer's pose and outfit, and stays quiet while nothing changes", async () => {
    const playerRef = player();
    const local = transportOf("local");
    wire.local = local.transport;
    renderHook(() =>
      useWorldPresence({ enabled: true, playerRef, outfitId: "tempo" }),
    );
    await settle();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(local.published).toHaveLength(1);
    expect(local.published[0]).toMatchObject({ x: 10, z: 20, heading: 0.5, outfitId: "tempo" });
    expect(local.published[0].name).toEqual(expect.any(String));

    // Standing still: no new message until the heartbeat is due.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(local.published).toHaveLength(1);
  });

  it("publishes again when the explorer moves", async () => {
    const local = transportOf("local");
    wire.local = local.transport;
    const playerRef = player();
    renderHook(() => useWorldPresence({ enabled: true, playerRef, outfitId: "tempo" }));
    await settle();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    playerRef.current.x = 12;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(local.published.map((snap) => snap.x)).toEqual([10, 12]);
  });

  it("sends a heartbeat while idle, so peers can tell standing still from gone", async () => {
    const playerRef = player();
    const local = transportOf("local");
    wire.local = local.transport;
    renderHook(() => useWorldPresence({ enabled: true, playerRef, outfitId: "tempo" }));
    await settle();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    expect(local.published.length).toBeGreaterThanOrEqual(2);
  });

  it("uses the outfit chosen since it started, not the one it started with", async () => {
    const playerRef = player();
    const local = transportOf("local");
    wire.local = local.transport;
    const { rerender } = renderHook(
      ({ outfitId }) => useWorldPresence({ enabled: true, playerRef, outfitId }),
      { initialProps: { outfitId: "tempo" } },
    );
    await settle();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    rerender({ outfitId: "raptors" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(local.published.map((snap) => snap.outfitId)).toEqual(["tempo", "raptors"]);
  });
});

describe("useWorldPresence peers", () => {
  const start = async () => {
    const playerRef = player();
    wire.local = transportOf("local").transport;
    const view = renderHook(() =>
      useWorldPresence({ enabled: true, playerRef, outfitId: "tempo" }),
    );
    await settle();
    return view;
  };

  it("lists an explorer once they are heard, with their name and outfit", async () => {
    const { result } = await start();

    act(() => wire.deliver({ peerId: "peer-1", snap: snapOf() }));

    await waitFor(() =>
      expect(result.current.peers).toEqual([
        { id: "peer-1", name: "Streetcar Fox", outfitId: "raptors" },
      ]),
    );
    expect(result.current.peersRef.current.get("peer-1")?.latest.snap.x).toBe(3);
  });

  it("keeps the previous pose to blend from, and updates their outfit when it changes", async () => {
    const { result } = await start();
    act(() => wire.deliver({ peerId: "peer-1", snap: snapOf() }));

    act(() => wire.deliver({ peerId: "peer-1", snap: snapOf({ x: 5, outfitId: "tempo" }) }));

    const peer = result.current.peersRef.current.get("peer-1");
    expect(peer?.prev?.snap.x).toBe(3);
    expect(peer?.latest.snap.x).toBe(5);
    await waitFor(() => expect(result.current.peers[0].outfitId).toBe("tempo"));
  });

  it("does not rebuild the peer list for a message that only moves them", async () => {
    const { result } = await start();
    act(() => wire.deliver({ peerId: "peer-1", snap: snapOf() }));
    const before = result.current.peers;

    act(() => wire.deliver({ peerId: "peer-1", snap: snapOf({ x: 9 }) }));

    expect(result.current.peers).toBe(before);
  });

  it("drops an explorer who goes quiet for longer than the timeout", async () => {
    const { result } = await start();
    act(() => wire.deliver({ peerId: "peer-1", snap: snapOf() }));
    expect(result.current.peers).toHaveLength(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6100);
    });

    expect(result.current.peers).toEqual([]);
    expect(result.current.peersRef.current.size).toBe(0);
  });

  it("keeps an explorer who keeps talking", async () => {
    const { result } = await start();
    act(() => wire.deliver({ peerId: "peer-1", snap: snapOf() }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    act(() => wire.deliver({ peerId: "peer-1", snap: snapOf({ x: 4 }) }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(result.current.peers).toHaveLength(1);
  });

  it("ignores messages that arrive after the world has gone", async () => {
    const { result, unmount } = await start();
    unmount();

    act(() => wire.deliver({ peerId: "late", snap: snapOf() }));

    expect(result.current.peersRef.current.size).toBe(0);
  });
});
