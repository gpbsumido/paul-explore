import { describe, it, expect, vi } from "vitest";
import { createLocalStorageStore } from "./localStorageStore";

type Tally = { count: number };
const EMPTY: Tally = { count: 0 };

/** A store over a key no other test touches, parsing a tally or falling back to empty. */
function tallyStore(key: string) {
  return createLocalStorageStore<Tally>({
    key,
    empty: EMPTY,
    parse: (raw) => (raw === null ? EMPTY : { count: Number(JSON.parse(raw).count) }),
  });
}

/**
 * Makes `window.localStorage` throw the way it does with storage blocked
 * (third-party cookie blocking, sandboxed iframes), until `restore` is called.
 */
function blockStorage() {
  const getter = vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  });
  return { restore: () => getter.mockRestore() };
}

/** What another tab writing the same key looks like from this one. */
function writeFromAnotherTab(key: string, value: string | null) {
  if (value === null) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, value);
  window.dispatchEvent(new StorageEvent("storage", { key, newValue: value }));
}

describe("createLocalStorageStore", () => {
  it("reads what's stored and hands back the same object until it changes", () => {
    window.localStorage.setItem("tally-read", JSON.stringify({ count: 3 }));
    const store = tallyStore("tally-read");

    const first = store.getSnapshot();
    expect(first).toEqual({ count: 3 });
    expect(store.getSnapshot()).toBe(first);
  });

  it("writes JSON and tells this tab's subscribers", () => {
    const store = tallyStore("tally-write");
    const listener = vi.fn();
    store.subscribe(listener);

    store.write({ count: 5 });

    expect(window.localStorage.getItem("tally-write")).toBe('{"count":5}');
    expect(store.getSnapshot()).toEqual({ count: 5 });
    expect(listener).toHaveBeenCalledOnce();
  });

  it("picks up a change another tab made to its key", () => {
    const store = tallyStore("tally-tabs");
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.getSnapshot()).toEqual(EMPTY);

    writeFromAnotherTab("tally-tabs", JSON.stringify({ count: 9 }));

    expect(listener).toHaveBeenCalledOnce();
    expect(store.getSnapshot()).toEqual({ count: 9 });
  });

  it("ignores another tab's changes to other keys", () => {
    const store = tallyStore("tally-mine");
    const listener = vi.fn();
    store.subscribe(listener);

    writeFromAnotherTab("someone-elses-key", "1");

    expect(listener).not.toHaveBeenCalled();
  });

  it("stops listening once unsubscribed", () => {
    const store = tallyStore("tally-unsub");
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();

    writeFromAnotherTab("tally-unsub", JSON.stringify({ count: 1 }));
    store.write({ count: 2 });

    expect(listener).not.toHaveBeenCalled();
  });

  it("notices storage cleared out from under it", () => {
    const store = tallyStore("tally-cleared");
    store.write({ count: 4 });

    window.localStorage.clear();

    expect(store.getSnapshot()).toEqual(EMPTY);
  });

  it("shows the empty value when storage is blocked", () => {
    const storage = blockStorage();
    try {
      expect(tallyStore("tally-blocked").getSnapshot()).toBe(EMPTY);
    } finally {
      storage.restore();
    }
  });

  it("keeps a write for this page when storage is blocked", () => {
    const store = tallyStore("tally-blocked-write");
    const listener = vi.fn();
    store.subscribe(listener);
    const storage = blockStorage();
    try {
      store.write({ count: 6 });

      expect(store.getSnapshot()).toEqual({ count: 6 });
      expect(listener).toHaveBeenCalledOnce();
    } finally {
      storage.restore();
    }
  });

  it("renders empty on the server", () => {
    window.localStorage.setItem("tally-server", JSON.stringify({ count: 7 }));
    expect(tallyStore("tally-server").getServerSnapshot()).toBe(EMPTY);
  });
});
