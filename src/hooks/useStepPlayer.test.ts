import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStepPlayer } from "./useStepPlayer";

type KeyArg = Parameters<
  ReturnType<typeof useStepPlayer>["onKeyDown"]
>[0];
const key = (k: string) =>
  ({ key: k, preventDefault: () => {} }) as unknown as KeyArg;

describe("useStepPlayer", () => {
  afterEach(() => vi.useRealTimers());

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

  it("reset returns to the start and stops", () => {
    const { result } = renderHook(() => useStepPlayer(3));
    act(() => {
      result.current.advance();
      result.current.advance();
    });
    act(() => result.current.reset());
    expect(result.current.stepIdx).toBe(0);
    expect(result.current.playing).toBe(false);
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
});
