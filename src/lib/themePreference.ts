// Lives outside ThemeProvider ("use client") so the server layout can put the
// key into its pre-paint script; a server import of a client module gets a
// reference, not the string.
export const THEME_STORAGE_KEY = "theme-preference";

export type ThemePreference = "light" | "dark" | "system";

/** A saved value, or "system" when nothing usable is saved. */
export function toThemePreference(stored: string | null): ThemePreference {
  return stored === "light" || stored === "dark" ? stored : "system";
}
