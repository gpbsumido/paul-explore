import { useEffect, useRef } from "react";

interface UseCommandPaletteHotkeyOptions {
  /** Called when the palette should open. */
  onOpen: () => void;
}

/** True when the event originated from a field where "/" is a normal keystroke. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  const editable = target.getAttribute("contenteditable");
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable ||
    (editable !== null && editable !== "false")
  );
}

/**
 * Global listener that opens the command palette on Cmd/Ctrl+K from anywhere, or
 * on a bare "/" when the user isn't typing into a field. The latest onOpen is
 * read through a ref so the window listener is attached only once.
 */
export function useCommandPaletteHotkey({
  onOpen,
}: UseCommandPaletteHotkeyOptions): void {
  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isCmdK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isCmdK) {
        event.preventDefault();
        onOpenRef.current();
        return;
      }

      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        onOpenRef.current();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
