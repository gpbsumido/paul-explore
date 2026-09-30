// A small client-side delivery layer for ZeroProof telemetry: enqueue cheaply,
// batch, persist, retry with backoff, and flush on tab-exit via sendBeacon.
//
// The design keeps all the IO behind injected ports (transport, store, clock,
// timers) so the queue logic here is pure and unit-testable without a browser.
// The React component wires the real ports; tests wire fakes.

/** One anonymous telemetry event. Matches the backend's `trackEventSchema`. */
export type TrackEvent = {
  eventUuid: string;
  name: string;
  page: string;
  seq: number;
  sessionId: string;
  anonId: string;
  clientTs: string;
  props?: Record<string, unknown>;
  appVersion: string;
};

/** Sends batches. `send` returns the HTTP status (0 for a network error);
 * `beacon` is the synchronous, fire-and-forget page-exit path. */
export type Transport = {
  send: (events: TrackEvent[]) => Promise<number>;
  beacon: (events: TrackEvent[]) => boolean;
};

/** Persistence for the pending queue, so a reload or offline spell keeps events. */
export type QueueStore = {
  load: () => TrackEvent[];
  save: (events: TrackEvent[]) => void;
};

export type Limits = {
  maxEvents: number;
  maxBytes: number;
  maxAgeMs: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
};

export const DEFAULT_LIMITS: Limits = {
  // Flush on whichever comes first. Bigger batches mean fewer requests but more
  // at risk if the tab dies, so these stay modest.
  maxEvents: 20,
  maxBytes: 60_000, // under sendBeacon's ~64KB cap
  maxAgeMs: 5_000,
  baseBackoffMs: 1_000,
  maxBackoffMs: 30_000,
};

/**
 * Whether a failed send should be retried. Network errors (status 0), 429 and
 * 5xx are transient. A 4xx is not: a malformed event retried forever is a
 * poison pill that blocks the whole queue, so it's dropped instead.
 */
export function isRetryableStatus(status: number): boolean {
  if (status === 0 || status === 429) return true;
  return status >= 500 && status < 600;
}

/** The backoff ceiling for an attempt: base doubled per attempt, capped. */
export function backoffCeilingMs(attempt: number, baseMs: number, capMs: number): number {
  return Math.min(capMs, baseMs * 2 ** attempt);
}

/**
 * Backoff delay with equal jitter — half the ceiling fixed, half random — so a
 * fleet of clients that failed together don't retry in lockstep. Bounded to
 * [ceiling/2, ceiling).
 */
export function nextBackoffMs(
  attempt: number,
  { baseMs, capMs, random }: { baseMs: number; capMs: number; random: () => number },
): number {
  const ceiling = backoffCeilingMs(attempt, baseMs, capMs);
  return ceiling / 2 + random() * (ceiling / 2);
}

export type FlushReason = "size" | "bytes" | "time";

/** Why the queue should flush now, or null to keep waiting. */
export function flushReason(
  state: { count: number; bytes: number; oldestEnqueuedAt: number | null },
  now: number,
  limits: Pick<Limits, "maxEvents" | "maxBytes" | "maxAgeMs">,
): FlushReason | null {
  if (state.count === 0) return null;
  if (state.count >= limits.maxEvents) return "size";
  if (state.bytes >= limits.maxBytes) return "bytes";
  if (state.oldestEnqueuedAt !== null && now - state.oldestEnqueuedAt >= limits.maxAgeMs) {
    return "time";
  }
  return null;
}

function byteSize(events: TrackEvent[]): number {
  return new TextEncoder().encode(JSON.stringify(events)).length;
}

/** The real browser transport, hitting the same-origin BFF. */
export function createTransport(url: string): Transport {
  return {
    async send(events) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events }),
          keepalive: true,
        });
        return res.status;
      } catch {
        return 0;
      }
    },
    beacon(events) {
      if (typeof navigator === "undefined" || !navigator.sendBeacon) return false;
      // A plain string, not a Blob typed application/json: that type isn't
      // CORS-safelisted and would force a preflight the beacon can't survive.
      return navigator.sendBeacon(url, JSON.stringify({ events }));
    },
  };
}

type TimerHandle = number;

export type TrackerDeps = {
  transport: Transport;
  store: QueueStore;
  now: () => number;
  newUuid: () => string;
  random: () => number;
  setTimer: (fn: () => void, ms: number) => TimerHandle;
  clearTimer: (handle: TimerHandle) => void;
  identity: { anonId: string; sessionId: string };
  appVersion: string;
  limits?: Partial<Limits>;
};

export type Tracker = {
  track: (name: string, page: string, props?: Record<string, unknown>) => void;
  flush: (opts?: { beacon?: boolean }) => Promise<void> | void;
  pending: () => TrackEvent[];
};

/**
 * Builds a tracker over the given ports. `track` is synchronous and cheap;
 * everything expensive (serialize, persist, send) happens off the caller's
 * path. Delivery is at-least-once — events are removed only after a 2xx — and
 * the server dedupes on `event_uuid`.
 */
export function createTracker(deps: TrackerDeps): Tracker {
  const limits: Limits = { ...DEFAULT_LIMITS, ...deps.limits };
  let queue: TrackEvent[] = deps.store.load();
  let lastSeq = queue.reduce((max, event) => Math.max(max, event.seq), 0);
  let oldestEnqueuedAt: number | null = queue.length > 0 ? deps.now() : null;
  let timer: TimerHandle | null = null;
  let attempt = 0;
  let flushing = false;

  function clearTimer() {
    if (timer !== null) {
      deps.clearTimer(timer);
      timer = null;
    }
  }

  function scheduleTimer(ms: number) {
    clearTimer();
    timer = deps.setTimer(() => {
      timer = null;
      void flush();
    }, ms);
  }

  function maybeFlush() {
    const reason = flushReason(
      { count: queue.length, bytes: byteSize(queue), oldestEnqueuedAt },
      deps.now(),
      limits,
    );
    if (reason) {
      void flush();
      return;
    }
    if (queue.length > 0 && timer === null) scheduleTimer(limits.maxAgeMs);
  }

  function track(name: string, page: string, props?: Record<string, unknown>) {
    const event: TrackEvent = {
      eventUuid: deps.newUuid(),
      name,
      page,
      seq: ++lastSeq,
      sessionId: deps.identity.sessionId,
      anonId: deps.identity.anonId,
      clientTs: new Date(deps.now()).toISOString(),
      appVersion: deps.appVersion,
      ...(props ? { props } : {}),
    };
    queue.push(event);
    if (oldestEnqueuedAt === null) oldestEnqueuedAt = deps.now();
    deps.store.save(queue);
    maybeFlush();
  }

  function remove(batch: TrackEvent[]) {
    const sent = new Set(batch.map((event) => event.eventUuid));
    queue = queue.filter((event) => !sent.has(event.eventUuid));
    oldestEnqueuedAt = queue.length > 0 ? oldestEnqueuedAt : null;
    deps.store.save(queue);
  }

  async function flush(opts?: { beacon?: boolean }) {
    if (queue.length === 0) return;
    const batch = [...queue];

    if (opts?.beacon) {
      // Fire and keep: sendBeacon returning true means the request was queued,
      // not delivered, so the persisted copy stays and resends next load. The
      // server dedupes the overlap on event_uuid.
      deps.transport.beacon(batch);
      return;
    }

    if (flushing) return;
    flushing = true;
    clearTimer();
    try {
      const status = await deps.transport.send(batch);
      if (status >= 200 && status < 300) {
        attempt = 0;
        remove(batch);
        if (queue.length > 0) maybeFlush();
        return;
      }
      if (isRetryableStatus(status)) {
        attempt += 1;
        scheduleTimer(
          nextBackoffMs(attempt, {
            baseMs: limits.baseBackoffMs,
            capMs: limits.maxBackoffMs,
            random: deps.random,
          }),
        );
        return;
      }
      // Non-retryable (4xx): drop the batch rather than block the queue on it.
      attempt = 0;
      remove(batch);
    } finally {
      flushing = false;
    }
  }

  return { track, flush, pending: () => [...queue] };
}
