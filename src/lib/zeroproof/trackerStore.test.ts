import { beforeEach, describe, expect, it } from "vitest";
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
});

describe("createMemoryStore", () => {
  it("holds the last saved queue", () => {
    const store = createMemoryStore();
    store.save([event(1)]);
    expect(store.load().map((e) => e.seq)).toEqual([1]);
  });
});
