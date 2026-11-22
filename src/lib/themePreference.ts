// Lives outside ThemeProvider ("use client") so the server layout can put the
// key into its pre-paint script; a server import of a client module gets a
// reference, not the string.
export const THEME_STORAGE_KEY = "theme-preference";

export type ThemePreference = "light" | "dark" | "system";

/** A saved value, or "system" when nothing usable is saved. */
export function toThemePreference(stored: string | null): ThemePreference {
  return stored === "light" || stored === "dark" ? stored : "system";
}

/**
 * The script layout.tsx runs in the head, before CSS or React load, to put the
 * saved theme on <html> so a returning visitor never sees the wrong one flash
 * first. It can't import anything, so it's built here as text, next to the key
 * and the rule it has to follow: anything that isn't light or dark follows the
 * OS, the same as toThemePreference.
 */
export function buildPrePaintThemeScript(): string {
  return `(function(){try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');if(p!=='light'&&p!=='dark')p='system';var t=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
}
