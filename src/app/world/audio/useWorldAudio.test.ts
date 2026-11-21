import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, renderHook } from "@testing-library/react";

const engines = vi.hoisted(
  () => [] as { setMuted: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> }[],
);

// The synth itself needs a real AudioContext. This hook only decides when one
// is built and whether it is muted, so a recording stand-in is enough.
vi.mock("./engine", () => ({
  createWorldAudio: () => {
    const engine = { setMuted: vi.fn(), dispose: vi.fn() };
    engines.push(engine);
    return engine;
  },
}));

import { useWorldAudio } from "./useWorldAudio";

const MUTED_KEY = "world-muted";

beforeEach(() => {
  engines.length = 0;
  window.localStorage.clear();
});

describe("useWorldAudio", () => {
  it("starts muted when nothing was saved, and builds no audio engine", () => {
    const { result } = renderHook(() => useWorldAudio(true));

    expect(result.current.muted).toBe(true);
    fireEvent.keyDown(window, { code: "KeyW" });
    expect(engines).toHaveLength(0);
  });

  it("remembers the visitor turned sound on", () => {
    window.localStorage.setItem(MUTED_KEY, "on");

    const { result } = renderHook(() => useWorldAudio(true));

    expect(result.current.muted).toBe(false);
  });

  it("waits for the first key press before making any sound", () => {
    window.localStorage.setItem(MUTED_KEY, "on");
    renderHook(() => useWorldAudio(true));
    expect(engines).toHaveLength(0);

    act(() => {
      fireEvent.keyDown(window, { code: "KeyW" });
    });

    expect(engines).toHaveLength(1);
    expect(engines[0].setMuted).toHaveBeenCalledWith(false);
  });

  it("wakes on a pointer press just the same", () => {
    window.localStorage.setItem(MUTED_KEY, "on");
    renderHook(() => useWorldAudio(true));

    act(() => {
      fireEvent.pointerDown(window);
    });

    expect(engines).toHaveLength(1);
    expect(engines[0].setMuted).toHaveBeenCalledWith(false);
  });

  it("builds only one engine however many presses follow", () => {
    window.localStorage.setItem(MUTED_KEY, "on");
    renderHook(() => useWorldAudio(true));

    act(() => {
      fireEvent.keyDown(window, { code: "KeyW" });
    });
    act(() => {
      fireEvent.keyDown(window, { code: "KeyA" });
      fireEvent.pointerDown(window);
    });

    expect(engines).toHaveLength(1);
  });

  it("stays silent while the world is not enabled", () => {
    window.localStorage.setItem(MUTED_KEY, "on");
    renderHook(() => useWorldAudio(false));

    fireEvent.keyDown(window, { code: "KeyW" });

    expect(engines).toHaveLength(0);
  });

  it("unmuting is itself the gesture: it builds the engine, plays, and remembers", () => {
    const { result } = renderHook(() => useWorldAudio(true));

    act(() => result.current.toggleMuted());

    expect(result.current.muted).toBe(false);
    expect(window.localStorage.getItem(MUTED_KEY)).toBe("on");
    expect(engines).toHaveLength(1);
    expect(engines[0].setMuted).toHaveBeenLastCalledWith(false);
  });

  it("muting again silences the same engine and remembers that too", () => {
    const { result } = renderHook(() => useWorldAudio(true));
    act(() => result.current.toggleMuted());

    act(() => result.current.toggleMuted());

    expect(result.current.muted).toBe(true);
    expect(window.localStorage.getItem(MUTED_KEY)).toBe("off");
    expect(engines).toHaveLength(1);
    expect(engines[0].setMuted).toHaveBeenLastCalledWith(true);
  });

  it("shuts the engine down when the world goes away", () => {
    const { result, unmount } = renderHook(() => useWorldAudio(true));
    act(() => result.current.toggleMuted());

    unmount();

    expect(engines[0].dispose).toHaveBeenCalledTimes(1);
  });
});
