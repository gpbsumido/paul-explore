/**
 * A window-level event that asks the globally mounted command palette to open.
 * The palette is a single instance rendered high in the tree, so anything
 * elsewhere (a header button on the landing/hub, say) opens it by dispatching
 * this event rather than being wired to its state. Mirrors the global keydown
 * hotkey, which already opens the palette from a window listener.
 */
export const COMMAND_PALETTE_OPEN_EVENT = "commandpalette:open";

/** Ask the command palette to open from anywhere in the tree. No-op on the server. */
export function openCommandPalette(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT));
}
