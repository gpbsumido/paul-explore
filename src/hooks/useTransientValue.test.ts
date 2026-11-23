import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useTransientValue } from "./useTransientValue";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/**
 * "Copied!", a flashed row, a toast: show something, then let it go. Each copy
 * of that started a timer and forgot it, so a second click inside the window
 * was cut short by the first click's timer, and an unmount left one running.
 */
describe("useTransientValue", () => {
  it("shows a value, then clears it once the time is up", () => {
    const { result } = renderHook(() => useTransientValue<string>(1000));
    expect(result.current[0]).toBeNull();

    act(() => result.current[1]("copied"));
    expect(result.current[0]).toBe("copied");

    act(() => vi.advanceTimersByTime(999));
    expect(result.current[0]).toBe("copied");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current[0]).toBeNull();
  });

  it("restarts the clock when shown again before it clears", () => {
    const { result } = renderHook(() => useTransientValue<string>(1000));
    act(() => result.current[1]("first"));
    act(() => vi.advanceTimersByTime(800));
    act(() => result.current[1]("second"));
    act(() => vi.advanceTimersByTime(800));
    expect(result.current[0]).toBe("second");
    act(() => vi.advanceTimersByTime(200));
    expect(result.current[0]).toBeNull();
  });

  it("leaves no timer running after unmount", () => {
    const { result, unmount } = renderHook(() => useTransientValue<string>(1000));
    act(() => result.current[1]("copied"));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
