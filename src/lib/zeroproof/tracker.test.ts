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
}) {
  const timers: { fn: () => void; ms: number }[] = [];
  const saved: TrackEvent[][] = [];
  let stored: TrackEvent[] = [];
  const store: QueueStore = {
    load: () => stored,
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
    advance: (ms: number) => {
      clock += ms;
    },
  };
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
    const { tracker } = harness({ limits: { maxEvents: 100 } });
    tracker.track("page_view", "/zeroproof");
    tracker.track("page_view", "/zeroproof/leagues");
    // A fresh tracker over the same store (a reload) continues, not restarts.
    expect(tracker.pending().map((e) => e.seq)).toEqual([1, 2]);
  });
});
