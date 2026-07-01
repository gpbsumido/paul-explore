import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createToastStore, type ToastStore } from "@/lib/operator-toast";

// ---------------------------------------------------------------------------
// createToastStore — pure toast state management
// ---------------------------------------------------------------------------

describe("createToastStore", () => {
  let store: ToastStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = createToastStore();
  });

  afterEach(() => {
    store.destroy();
    vi.useRealTimers();
  });

  it("starts with an empty toast list", () => {
    expect(store.getToasts()).toEqual([]);
  });

  it("adds a toast with the given message", () => {
    store.addToast({ message: "Restocked 4 items" });
    const toasts = store.getToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe("Restocked 4 items");
  });

  it("assigns a unique id to each toast", () => {
    store.addToast({ message: "First" });
    store.addToast({ message: "Second" });
    const toasts = store.getToasts();
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it("supports an optional variant (success, error, info)", () => {
    store.addToast({ message: "Done", variant: "success" });
    expect(store.getToasts()[0].variant).toBe("success");
  });

  it("defaults variant to 'success' when not provided", () => {
    store.addToast({ message: "Done" });
    expect(store.getToasts()[0].variant).toBe("success");
  });

  it("removes a toast by id", () => {
    store.addToast({ message: "First" });
    store.addToast({ message: "Second" });
    const id = store.getToasts()[0].id;
    store.removeToast(id);
    expect(store.getToasts()).toHaveLength(1);
    expect(store.getToasts()[0].message).toBe("Second");
  });

  it("auto-dismisses toasts after 3 seconds", () => {
    store.addToast({ message: "Ephemeral" });
    expect(store.getToasts()).toHaveLength(1);

    vi.advanceTimersByTime(3000);
    expect(store.getToasts()).toHaveLength(0);
  });

  it("does not dismiss toasts before 3 seconds", () => {
    store.addToast({ message: "Still here" });
    vi.advanceTimersByTime(2999);
    expect(store.getToasts()).toHaveLength(1);
  });

  it("handles multiple toasts with independent timers", () => {
    store.addToast({ message: "First" });
    vi.advanceTimersByTime(1500);
    store.addToast({ message: "Second" });

    // 1500ms later: first toast at 3000ms total, should be gone
    vi.advanceTimersByTime(1500);
    const remaining = store.getToasts();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe("Second");
  });

  it("notifies subscribers when toasts change", () => {
    const listener = vi.fn();
    store.subscribe(listener);

    store.addToast({ message: "Hello" });
    expect(listener).toHaveBeenCalledTimes(1);

    const id = store.getToasts()[0].id;
    store.removeToast(id);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("unsubscribes correctly", () => {
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    unsub();

    store.addToast({ message: "Ignored" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("clears all pending timers on destroy", () => {
    store.addToast({ message: "One" });
    store.addToast({ message: "Two" });
    store.destroy();

    // after destroy, timers should not modify state
    vi.advanceTimersByTime(5000);
    // store is destroyed, just verify no errors thrown
  });
});
