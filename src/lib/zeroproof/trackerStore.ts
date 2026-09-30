// Persistence for the pending telemetry queue, so events survive a reload or an
// offline spell rather than dying with the tab.
//
// localStorage over IndexedDB is a deliberate call at this volume: the queue is
// a handful of small events, touched only on enqueue and flush, and the simple
// synchronous API is worth more than IndexedDB's async ergonomics here. The
// writes are small and infrequent enough not to matter for interaction latency;
// IndexedDB is the upgrade path if ZeroProof ever emits high-frequency events.

import type { QueueStore, TrackEvent } from "./tracker";

/** In-memory fallback for when Web Storage is unavailable (private mode, quota). */
export function createMemoryStore(initial: TrackEvent[] = []): QueueStore {
  let events = [...initial];
  return {
    load: () => [...events],
    save: (next) => {
      events = [...next];
    },
  };
}

/**
 * A localStorage-backed queue store, keyed per session so two tabs keep disjoint
 * queues (no shared-storage double-flush). If storage throws — quota, disabled —
 * it degrades to an in-memory queue for the rest of the tab's life.
 */
export function createQueueStore(sessionId: string): QueueStore {
  const key = `zp_queue:${sessionId}`;
  const fallback = createMemoryStore();
  let degraded = false;

  return {
    load: () => {
      if (degraded) return fallback.load();
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as TrackEvent[]) : [];
      } catch {
        return [];
      }
    },
    save: (events) => {
      if (degraded) {
        fallback.save(events);
        return;
      }
      try {
        window.localStorage.setItem(key, JSON.stringify(events));
      } catch {
        degraded = true;
        fallback.save(events);
      }
    },
  };
}
