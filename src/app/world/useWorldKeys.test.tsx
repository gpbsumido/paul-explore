import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useWorldKeys } from "./useWorldKeys";

/** Mounts the hook, plus the kinds of field a visitor might be typing in. */
const mountKeys = (onPhotoToggle?: () => void) => {
  const onInteract = vi.fn();
  const hook = renderHook(() => useWorldKeys(onInteract, onPhotoToggle));
  render(
    <>
      <input aria-label="chat" />
      <textarea aria-label="notes" />
      <div aria-label="editable" contentEditable suppressContentEditableWarning />
    </>,
  );
  return { onInteract, held: () => [...hook.result.current.current].sort() };
};

describe("useWorldKeys", () => {
  it("holds a movement key down until it is released", () => {
    const { held } = mountKeys();

    fireEvent.keyDown(window, { code: "KeyW" });
    fireEvent.keyDown(window, { code: "ShiftLeft" });
    expect(held()).toEqual(["KeyW", "ShiftLeft"]);

    fireEvent.keyUp(window, { code: "KeyW" });
    expect(held()).toEqual(["ShiftLeft"]);
  });

  it("lets go of everything when the window loses focus, so the avatar stops", () => {
    const { held } = mountKeys();
    fireEvent.keyDown(window, { code: "KeyW" });
    fireEvent.keyDown(window, { code: "KeyD" });

    fireEvent.blur(window);

    expect(held()).toEqual([]);
  });

  it("stops the page scrolling on movement keys, and only those", () => {
    mountKeys();

    const arrow = new KeyboardEvent("keydown", { code: "ArrowDown", cancelable: true });
    window.dispatchEvent(arrow);
    const space = new KeyboardEvent("keydown", { code: "Space", cancelable: true });
    window.dispatchEvent(space);
    const letter = new KeyboardEvent("keydown", { code: "KeyQ", cancelable: true });
    window.dispatchEvent(letter);

    expect(arrow.defaultPrevented).toBe(true);
    expect(space.defaultPrevented).toBe(true);
    expect(letter.defaultPrevented).toBe(false);
  });

  it.each([["KeyE"], ["Enter"]])("interacts on %s", (code) => {
    const { onInteract } = mountKeys();

    fireEvent.keyDown(window, { code });

    expect(onInteract).toHaveBeenCalledTimes(1);
  });

  it("does not interact on a movement key", () => {
    const { onInteract } = mountKeys();

    fireEvent.keyDown(window, { code: "KeyW" });

    expect(onInteract).not.toHaveBeenCalled();
  });

  it("toggles photo mode on P, when it is wired", () => {
    const onPhotoToggle = vi.fn();
    mountKeys(onPhotoToggle);

    fireEvent.keyDown(window, { code: "KeyP" });

    expect(onPhotoToggle).toHaveBeenCalledTimes(1);
  });

  it("shrugs off P when photo mode is not wired", () => {
    const { held } = mountKeys();

    expect(() => fireEvent.keyDown(window, { code: "KeyP" })).not.toThrow();
    expect(held()).toEqual(["KeyP"]);
  });

  it.each([["chat"], ["notes"], ["editable"]])(
    "ignores keys typed into the %s field",
    (label) => {
      const { onInteract, held } = mountKeys();
      const field = screen.getByLabelText(label);
      // jsdom never computes isContentEditable, so say what a browser would.
      if (label === "editable") {
        Object.defineProperty(field, "isContentEditable", { value: true });
      }

      fireEvent.keyDown(field, { code: "KeyE" });
      fireEvent.keyDown(field, { code: "KeyW" });

      expect(onInteract).not.toHaveBeenCalled();
      expect(held()).toEqual([]);
    },
  );

  it("ignores shortcuts that use Cmd or Ctrl, so browser shortcuts keep working", () => {
    const { onInteract, held } = mountKeys();

    fireEvent.keyDown(window, { code: "KeyE", metaKey: true });
    fireEvent.keyDown(window, { code: "KeyW", ctrlKey: true });

    expect(onInteract).not.toHaveBeenCalled();
    expect(held()).toEqual([]);
  });

  it("calls the latest interact handler, not the one from the first render", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ onInteract }) => useWorldKeys(onInteract), {
      initialProps: { onInteract: first },
    });
    rerender({ onInteract: second });

    fireEvent.keyDown(window, { code: "KeyE" });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops listening once unmounted", () => {
    const onInteract = vi.fn();
    const hook = renderHook(() => useWorldKeys(onInteract));
    hook.unmount();

    fireEvent.keyDown(window, { code: "KeyE" });

    expect(onInteract).not.toHaveBeenCalled();
  });
});
