import { useSyncExternalStore } from "react";

/** The Command symbol on Apple devices, "Ctrl" everywhere else. */
function detectShortcutKey(): string {
  if (typeof navigator === "undefined") return "Ctrl";
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform =
    nav.userAgentData?.platform || nav.platform || nav.userAgent || "";
  return /mac|iphone|ipad|ipod/i.test(platform) ? "⌘" : "Ctrl";
}

// Platform never changes for the life of the page, so there is nothing to
// subscribe to. Returning a no-op unsubscribe is enough for useSyncExternalStore.
const subscribe = (): (() => void) => () => {};

const getSnapshot = (): string | null => detectShortcutKey();

// null on the server (and during hydration), so the first paint matches the
// server render; useSyncExternalStore swaps in the real key once hydrated.
const getServerSnapshot = (): string | null => null;

/**
 * The primary shortcut modifier label for the current platform, for hints like
 * "⌘K" / "Ctrl K". null until hydrated, so it never mismatches the server
 * render; callers hold off drawing the hint until then (the shortcut itself
 * works on every platform regardless — see useCommandPaletteHotkey, which
 * handles both Cmd and Ctrl).
 */
export function useShortcutKey(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
