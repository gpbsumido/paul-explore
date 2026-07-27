import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCommandPaletteHotkey } from "../useCommandPaletteHotkey";

function keydown(init: KeyboardEventInit & { target?: EventTarget }) {
  const event = new KeyboardEvent("keydown", {
    ...init,
    bubbles: true,
    cancelable: true,
  });
  const target = init.target ?? document.body;
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useCommandPaletteHotkey", () => {
  it("opens on Cmd+K", () => {
    const onOpen = vi.fn();
    renderHook(() => useCommandPaletteHotkey({ onOpen }));
    keydown({ key: "k", metaKey: true });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("opens on Ctrl+K", () => {
    const onOpen = vi.fn();
    renderHook(() => useCommandPaletteHotkey({ onOpen }));
    keydown({ key: "k", ctrlKey: true });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("prevents the browser default on Cmd+K", () => {
    renderHook(() => useCommandPaletteHotkey({ onOpen: vi.fn() }));
    const event = keydown({ key: "k", metaKey: true });
    expect(event.defaultPrevented).toBe(true);
  });

  it("opens on a bare slash", () => {
    const onOpen = vi.fn();
    renderHook(() => useCommandPaletteHotkey({ onOpen }));
    keydown({ key: "/" });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("ignores slash while typing in an input", () => {
    const onOpen = vi.fn();
    renderHook(() => useCommandPaletteHotkey({ onOpen }));
    const input = document.createElement("input");
    document.body.appendChild(input);
    keydown({ key: "/", target: input });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("ignores slash while typing in a contenteditable element", () => {
    const onOpen = vi.fn();
    renderHook(() => useCommandPaletteHotkey({ onOpen }));
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    document.body.appendChild(editable);
    keydown({ key: "/", target: editable });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("does not fire a plain letter key", () => {
    const onOpen = vi.fn();
    renderHook(() => useCommandPaletteHotkey({ onOpen }));
    keydown({ key: "k" });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("removes its listener on unmount", () => {
    const onOpen = vi.fn();
    const { unmount } = renderHook(() => useCommandPaletteHotkey({ onOpen }));
    unmount();
    keydown({ key: "k", metaKey: true });
    expect(onOpen).not.toHaveBeenCalled();
  });
});
