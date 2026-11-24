import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryStore, createQueueStore } from "./trackerStore";
import type { TrackEvent } from "./tracker";

const event = (seq: number): TrackEvent => ({
  eventUuid: `uuid-${seq}`,
  name: "page_view",
  page: "/zeroproof",
  seq,
  sessionId: "sess-1",
  anonId: "anon-hash",
  clientTs: "2026-09-29T00:00:00.000Z",
  appVersion: "7.9.3",
});

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("createQueueStore", () => {
  it("round-trips the queue and restores it for the same session (a reload)", () => {
    createQueueStore("sess-1").save([event(1), event(2)]);

    const restored = createQueueStore("sess-1").load();
    expect(restored.map((e) => e.seq)).toEqual([1, 2]);
  });

  it("keeps sessions disjoint so two tabs don't share a queue", () => {
    createQueueStore("sess-1").save([event(1)]);
    expect(createQueueStore("sess-2").load()).toEqual([]);
  });

  it("returns an empty queue for absent or malformed storage", () => {
    window.localStorage.setItem("zp_queue:sess-9", "{not json");
    expect(createQueueStore("sess-9").load()).toEqual([]);
    expect(createQueueStore("never-seen").load()).toEqual([]);
  });

  it("returns an empty queue when storage holds valid JSON that is not a list", () => {
    window.localStorage.setItem("zp_queue:sess-8", '{"events":[]}');
    expect(createQueueStore("sess-8").load()).toEqual([]);
  });

  it("keeps the queue in memory for the rest of the tab once storage refuses a write", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    const store = createQueueStore("sess-full");

    store.save([event(1)]);
    store.save([event(1), event(2)]);

    expect(store.load().map((e) => e.seq)).toEqual([1, 2]);
    expect(setItem).toHaveBeenCalled();
    expect(window.localStorage.getItem("zp_queue:sess-full")).toBeNull();
  });
});

describe("createMemoryStore", () => {
  it("holds the last saved queue", () => {
    const store = createMemoryStore();
    store.save([event(1)]);
    expect(store.load().map((e) => e.seq)).toEqual([1]);
  });

  it("starts from the events it is given and does not share the caller's array", () => {
    const seed = [event(1)];
    const store = createMemoryStore(seed);
    seed.push(event(2));
    expect(store.load().map((e) => e.seq)).toEqual([1]);
  });

  it("hands back a copy, so changing a loaded queue does not change what is stored", () => {
    const store = createMemoryStore([event(1)]);
    store.load().push(event(2));
    expect(store.load().map((e) => e.seq)).toEqual([1]);
  });

  it("keeps a copy of what was saved, not the caller's array", () => {
    const store = createMemoryStore();
    const next = [event(1)];
    store.save(next);
    next.push(event(2));
    expect(store.load().map((e) => e.seq)).toEqual([1]);
  });
});
