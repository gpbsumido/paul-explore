import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStepPlayer } from "./useStepPlayer";

type KeyArg = Parameters<
  ReturnType<typeof useStepPlayer>["onKeyDown"]
>[0];
const key = (k: string, preventDefault: () => void = () => {}) =>
  ({ key: k, preventDefault }) as unknown as KeyArg;

function setTabHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
}

describe("useStepPlayer", () => {
  afterEach(() => {
    vi.useRealTimers();
    setTabHidden(false);
  });

  it("advances and stops at the last step (no overrun)", () => {
    const { result } = renderHook(() => useStepPlayer(3));
    expect(result.current.stepIdx).toBe(0);
    act(() => result.current.advance());
    act(() => result.current.advance());
    expect(result.current.stepIdx).toBe(2);
    act(() => result.current.advance());
    expect(result.current.stepIdx).toBe(2);
  });

  it("back never goes below zero", () => {
    const { result } = renderHook(() => useStepPlayer(3));
    act(() => result.current.advance());
    act(() => result.current.back());
    act(() => result.current.back());
    expect(result.current.stepIdx).toBe(0);
  });

  it("reset returns to the start and stops playback for good", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useStepPlayer(5, { intervalMs: 100 }));
    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.stepIdx).toBe(2);

    act(() => result.current.reset());
    expect(result.current.stepIdx).toBe(0);
    expect(result.current.playing).toBe(false);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.stepIdx).toBe(0);
  });

  it("play runs to the last step and stops without overrunning", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useStepPlayer(3, { intervalMs: 100 }));
    act(() => result.current.play());
    expect(result.current.playing).toBe(true);
    act(() => vi.advanceTimersByTime(600));
    expect(result.current.stepIdx).toBe(2);
    expect(result.current.playing).toBe(false);
  });

  it("replaying from the end restarts from zero", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useStepPlayer(2, { intervalMs: 100 }));
    act(() => result.current.advance()); // now at the last step (1)
    act(() => result.current.play());
    expect(result.current.stepIdx).toBe(0);
  });

  it("onKeyDown maps arrows to step and space to play/pause", () => {
    const { result } = renderHook(() => useStepPlayer(3));
    act(() => result.current.onKeyDown(key("ArrowRight")));
    expect(result.current.stepIdx).toBe(1);
    act(() => result.current.onKeyDown(key("ArrowLeft")));
    expect(result.current.stepIdx).toBe(0);
    act(() => result.current.onKeyDown(key(" ")));
    expect(result.current.playing).toBe(true);
  });

  it("space pauses a run that is playing, and the next space picks it back up", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useStepPlayer(10, { intervalMs: 100 }));
    act(() => result.current.onKeyDown(key(" ")));
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.stepIdx).toBe(2);

    act(() => result.current.onKeyDown(key(" ")));
    expect(result.current.playing).toBe(false);
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.stepIdx).toBe(2);

    act(() => result.current.onKeyDown(key(" ")));
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.stepIdx).toBe(3);
  });

  it("treats the older 'Spacebar' key name like space", () => {
    const { result } = renderHook(() => useStepPlayer(3));
    act(() => result.current.onKeyDown(key("Spacebar")));
    expect(result.current.playing).toBe(true);
  });

  it("keeps the page from scrolling for the keys it handles and leaves other keys alone", () => {
    const { result } = renderHook(() => useStepPlayer(3));
    const handled = ["ArrowRight", "ArrowLeft", " "].map((k) => {
      const preventDefault = vi.fn();
      act(() => result.current.onKeyDown(key(k, preventDefault)));
      return preventDefault.mock.calls.length;
    });
    const preventDefaultForTab = vi.fn();
    act(() => result.current.onKeyDown(key("Tab", preventDefaultForTab)));

    expect(handled).toEqual([1, 1, 1]);
    expect(preventDefaultForTab).not.toHaveBeenCalled();
    expect(result.current.stepIdx).toBe(0);
  });

  it("holds its place while the tab is hidden and carries on when it comes back", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useStepPlayer(10, { intervalMs: 100 }));
    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.stepIdx).toBe(1);

    setTabHidden(true);
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.stepIdx).toBe(1);

    setTabHidden(false);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.stepIdx).toBe(2);
  });

  it("stops ticking when the component unmounts mid-play", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useStepPlayer(10, { intervalMs: 100 }));
    act(() => result.current.play());
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
