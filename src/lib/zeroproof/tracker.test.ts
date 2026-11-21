import { describe, expect, it, vi } from "vitest";
import {
  backoffCeilingMs,
  createTracker,
  flushReason,
  isRetryableStatus,
  nextBackoffMs,
  type QueueStore,
  type TrackEvent,
  type Transport,
} from "./tracker";

// A controllable clock and timer so time-based flushing is deterministic — no
// fake timers, no wall clock. The test fires the scheduled callback by hand.
function harness(overrides?: {
  send?: (events: TrackEvent[]) => Promise<number>;
  limits?: Partial<{ maxEvents: number; maxBytes: number; maxAgeMs: number }>;
  /** Events already persisted, as if restored after a reload. */
  initialQueue?: TrackEvent[];
}) {
  const timers: { fn: () => void; ms: number }[] = [];
  const saved: TrackEvent[][] = [];
  let stored: TrackEvent[] = overrides?.initialQueue ?? [];
  const store: QueueStore = {
    // A copy, like localStorage hands back, so the tracker can't mutate what is persisted.
    load: () => [...stored],
    save: (events) => {
      stored = [...events];
      saved.push(stored);
    },
  };
  const send = vi.fn(overrides?.send ?? (async () => 202));
  const beacon = vi.fn(() => true);
  const transport: Transport = { send, beacon };
  let clock = 1_000;

  const tracker = createTracker({
    transport,
    store,
    now: () => clock,
    newUuid: (() => {
      let n = 0;
      return () => `uuid-${++n}`;
    })(),
    random: () => 0,
    setTimer: (fn, ms) => {
      timers.push({ fn, ms });
      return timers.length - 1;
    },
    clearTimer: () => {},
    identity: { anonId: "anon-hash", sessionId: "sess-1" },
    appVersion: "7.9.3",
    limits: overrides?.limits,
  });

  return {
    tracker,
    send,
    beacon,
    timers,
    persisted: () => stored,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

const persistedEvent = (seq: number): TrackEvent => ({
  eventUuid: `restored-${seq}`,
  name: "page_view",
  page: "/zeroproof",
  seq,
  sessionId: "sess-1",
  anonId: "anon-hash",
  clientTs: "2026-09-29T00:00:00.000Z",
  appVersion: "7.9.3",
});

/** A send the test settles by hand, to hold a request in flight. */
function deferredSend() {
  const resolvers: ((status: number) => void)[] = [];
  const send = (): Promise<number> =>
    new Promise((resolve) => {
      resolvers.push(resolve);
    });
  return { send, settle: (index: number, status: number) => resolvers[index]?.(status) };
}

describe("isRetryableStatus", () => {
  it("retries network errors, 5xx and 429; drops 4xx", () => {
    expect(isRetryableStatus(0)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(413)).toBe(false);
    expect(isRetryableStatus(200)).toBe(false);
    expect(isRetryableStatus(600)).toBe(false);
  });
});

describe("backoff", () => {
  it("ceiling doubles per attempt, capped", () => {
    expect(backoffCeilingMs(0, 100, 5_000)).toBe(100);
    expect(backoffCeilingMs(1, 100, 5_000)).toBe(200);
    expect(backoffCeilingMs(2, 100, 5_000)).toBe(400);
    expect(backoffCeilingMs(10, 100, 5_000)).toBe(5_000);
  });

  it("jitter stays within [ceiling/2, ceiling) and never exceeds the cap", () => {
    const opts = { baseMs: 100, capMs: 5_000 };
    expect(nextBackoffMs(0, { ...opts, random: () => 0 })).toBe(50);
    expect(nextBackoffMs(0, { ...opts, random: () => 0.999 })).toBeLessThan(100);
    const high = nextBackoffMs(10, { ...opts, random: () => 0.999 });
    expect(high).toBeGreaterThanOrEqual(2_500);
    expect(high).toBeLessThanOrEqual(5_000);
  });
});

describe("flushReason", () => {
  const limits = { maxEvents: 20, maxBytes: 60_000, maxAgeMs: 5_000 };
  it("is null for an empty queue", () => {
    expect(flushReason({ count: 0, bytes: 0, oldestEnqueuedAt: null }, 9_999, limits)).toBeNull();
  });
  it("fires on size, bytes, and age", () => {
    expect(flushReason({ count: 20, bytes: 10, oldestEnqueuedAt: 0 }, 100, limits)).toBe("size");
    expect(flushReason({ count: 1, bytes: 60_000, oldestEnqueuedAt: 0 }, 100, limits)).toBe("bytes");
    expect(flushReason({ count: 1, bytes: 10, oldestEnqueuedAt: 0 }, 5_000, limits)).toBe("time");
    expect(flushReason({ count: 1, bytes: 10, oldestEnqueuedAt: 0 }, 4_999, limits)).toBeNull();
  });
});

describe("tracker", () => {
  it("stamps a monotonic per-session sequence on each event", () => {
    const { tracker } = harness({ limits: { maxEvents: 100 } });
    tracker.track("page_view", "/zeroproof");
    tracker.track("cta_click", "/zeroproof", { cta: "refer" });

    const pending = tracker.pending();
    expect(pending.map((e) => e.seq)).toEqual([1, 2]);
    expect(pending[0]).toMatchObject({
      name: "page_view",
      page: "/zeroproof",
      sessionId: "sess-1",
      anonId: "anon-hash",
      appVersion: "7.9.3",
    });
    expect(pending[1]?.props).toEqual({ cta: "refer" });
  });

  it("flushes once the batch-size threshold is reached", () => {
    const { tracker, send } = harness({ limits: { maxEvents: 20 } });
    for (let i = 0; i < 20; i++) tracker.track("page_view", "/zeroproof");
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]).toHaveLength(20);
  });

  it("flushes on the time threshold via the scheduled timer", () => {
    const { tracker, send, timers } = harness({ limits: { maxEvents: 20, maxAgeMs: 5_000 } });
    tracker.track("page_view", "/zeroproof");
    expect(send).not.toHaveBeenCalled();
    expect(timers.at(-1)?.ms).toBe(5_000);
    timers.at(-1)?.fn();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("flushes when the byte size nears the cap", () => {
    const { tracker, send } = harness({ limits: { maxEvents: 100, maxBytes: 200 } });
    tracker.track("page_view", "/zeroproof", { blob: "x".repeat(400) });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("removes events only after a 2xx", async () => {
    const ok = harness({ send: async () => 202 });
    ok.tracker.track("page_view", "/zeroproof");
    await ok.tracker.flush();
    expect(ok.tracker.pending()).toHaveLength(0);

    const fail = harness({ send: async () => 500 });
    fail.tracker.track("page_view", "/zeroproof");
    await fail.tracker.flush();
    expect(fail.tracker.pending()).toHaveLength(1);
  });

  it("drops a batch on a non-retryable 4xx rather than retrying a poison pill", async () => {
    const { tracker } = harness({ send: async () => 400 });
    tracker.track("page_view", "/zeroproof");
    await tracker.flush();
    expect(tracker.pending()).toHaveLength(0);
  });

  it("keeps the persisted queue when flushing via beacon (resend on next load, server dedupes)", () => {
    const { tracker, beacon, send } = harness();
    tracker.track("page_view", "/zeroproof");
    tracker.flush({ beacon: true });
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
    expect(tracker.pending()).toHaveLength(1);
  });

  it("resumes the sequence from a queue restored across a reload", () => {
    const { tracker } = harness({
      limits: { maxEvents: 100 },
      initialQueue: [persistedEvent(6), persistedEvent(7)],
    });
    tracker.track("page_view", "/zeroproof/leagues");
    // Continues after the restored events instead of restarting at 1.
    expect(tracker.pending().map((e) => e.seq)).toEqual([6, 7, 8]);
  });

  it("clears the persisted copy once the server has accepted the batch", async () => {
    const { tracker, persisted } = harness({ limits: { maxEvents: 100 } });
    tracker.track("page_view", "/zeroproof");
    await tracker.flush();
    expect(persisted()).toEqual([]);
  });

  it("persists each event as it is tracked, so a reload keeps it", () => {
    const { tracker, persisted } = harness({ limits: { maxEvents: 100 } });
    tracker.track("page_view", "/zeroproof");
    expect(persisted().map((e) => e.name)).toEqual(["page_view"]);
  });

  it("stamps the client time from the injected clock", () => {
    const { tracker } = harness({ limits: { maxEvents: 100 } });
    tracker.track("page_view", "/zeroproof");
    expect(tracker.pending()[0]?.clientTs).toBe(new Date(1_000).toISOString());
  });

  it("does not resend a batch that is already in flight", async () => {
    const pending = deferredSend();
    const { tracker, send } = harness({ send: pending.send });
    tracker.track("page_view", "/zeroproof");
    const first = tracker.flush();
    const second = tracker.flush();
    pending.settle(0, 202);
    await Promise.all([first, second]);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("removes only the batch that was sent, not events tracked while it was in flight", async () => {
    const pending = deferredSend();
    const { tracker } = harness({ send: pending.send, limits: { maxEvents: 100 } });
    tracker.track("page_view", "/zeroproof");
    const flushing = tracker.flush();
    tracker.track("cta_click", "/zeroproof");
    pending.settle(0, 202);
    await flushing;
    expect(tracker.pending().map((e) => e.name)).toEqual(["cta_click"]);
  });

  // Known bug: after a 2xx, flush() calls maybeFlush() while `flushing` is still
  // true, so the follow-up flush returns early and no timer is scheduled. A full
  // batch that piled up behind the one in flight sits there until the next
  // track() call. Marked as failing until the production code is fixed.
  it.fails("sends what piled up behind a batch as soon as it lands, if that is already a full batch", async () => {
    const pending = deferredSend();
    const { tracker, send } = harness({ send: pending.send, limits: { maxEvents: 2 } });
    tracker.track("page_view", "/a");
    tracker.track("page_view", "/b");
    expect(send).toHaveBeenCalledTimes(1);
    tracker.track("page_view", "/c");
    tracker.track("page_view", "/d");
    pending.settle(0, 202);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send.mock.calls[1]?.[0].map((e) => e.page)).toEqual(["/c", "/d"]);
  });

  it("backs off further on each consecutive failure, and starts over after a success", async () => {
    const statuses = [503, 503, 202, 503];
    const { tracker, timers } = harness({ send: async () => statuses.shift() ?? 202 });
    tracker.track("page_view", "/zeroproof");
    await tracker.flush();
    // random() is 0, so the delay is half the ceiling: 1s base doubled once.
    expect(timers.at(-1)?.ms).toBe(1_000);
    await tracker.flush();
    expect(timers.at(-1)?.ms).toBe(2_000);
    await tracker.flush();
    tracker.track("page_view", "/zeroproof");
    await tracker.flush();
    expect(timers.at(-1)?.ms).toBe(1_000);
  });

  it("starts the age clock fresh for events tracked after the queue emptied", async () => {
    const { tracker, send, advance } = harness();
    tracker.track("page_view", "/zeroproof");
    await tracker.flush();
    advance(60_000);
    tracker.track("page_view", "/zeroproof");
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("counts the age of restored events from when the tracker started", () => {
    const { tracker, send, advance } = harness({ initialQueue: [persistedEvent(1)] });
    advance(6_000);
    tracker.track("page_view", "/zeroproof");
    expect(send).toHaveBeenCalledTimes(1);
  });
});
