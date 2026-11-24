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

  it("prevents the browser default on a bare slash too, so no / is typed into the page", () => {
    renderHook(() => useCommandPaletteHotkey({ onOpen: vi.fn() }));
    const event = keydown({ key: "/" });
    expect(event.defaultPrevented).toBe(true);
  });

  it("leaves a slash alone while typing in a textarea or a select", () => {
    const onOpen = vi.fn();
    renderHook(() => useCommandPaletteHotkey({ onOpen }));
    const textarea = document.createElement("textarea");
    const select = document.createElement("select");
    document.body.append(textarea, select);
    const typed = keydown({ key: "/", target: textarea });
    keydown({ key: "/", target: select });
    expect(onOpen).not.toHaveBeenCalled();
    expect(typed.defaultPrevented).toBe(false);
  });

  it("opens on a slash from an element that says contenteditable is false", () => {
    const onOpen = vi.fn();
    renderHook(() => useCommandPaletteHotkey({ onOpen }));
    const block = document.createElement("div");
    block.setAttribute("contenteditable", "false");
    document.body.appendChild(block);
    keydown({ key: "/", target: block });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("does not treat a slash with a modifier held as the shortcut", () => {
    const onOpen = vi.fn();
    renderHook(() => useCommandPaletteHotkey({ onOpen }));
    keydown({ key: "/", altKey: true });
    keydown({ key: "/", ctrlKey: true });
    keydown({ key: "/", metaKey: true });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("opens on Cmd+K even from inside an input, and for a capital K", () => {
    const onOpen = vi.fn();
    renderHook(() => useCommandPaletteHotkey({ onOpen }));
    const input = document.createElement("input");
    document.body.appendChild(input);
    keydown({ key: "k", metaKey: true, target: input });
    keydown({ key: "K", ctrlKey: true, shiftKey: true });
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it("does not open on Cmd with some other key", () => {
    const onOpen = vi.fn();
    renderHook(() => useCommandPaletteHotkey({ onOpen }));
    keydown({ key: "j", metaKey: true });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("calls the latest onOpen after a re-render, without attaching a second listener", () => {
    const add = vi.spyOn(window, "addEventListener");
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ onOpen }) => useCommandPaletteHotkey({ onOpen }),
      { initialProps: { onOpen: first } },
    );
    rerender({ onOpen: second });

    keydown({ key: "k", metaKey: true });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    expect(add.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
    add.mockRestore();
  });
});
