import { useEffect, useState } from "react";

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

/**
 * The primary shortcut modifier label for the current platform, for hints like
 * "⌘K" / "Ctrl K". Resolved after mount, so it never mismatches the server
 * render; it returns null until then and callers hold off drawing the hint
 * (the shortcut itself works on every platform regardless — see
 * useCommandPaletteHotkey, which handles both Cmd and Ctrl).
 */
export function useShortcutKey(): string | null {
  const [key, setKey] = useState<string | null>(null);
  useEffect(() => {
    // Platform can only be read on the client, so resolve after mount rather
    // than in a lazy initializer that would mismatch the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKey(detectShortcutKey());
  }, []);
  return key;
}
