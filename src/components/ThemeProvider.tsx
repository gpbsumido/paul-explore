"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  THEME_STORAGE_KEY,
  toThemePreference,
  type ThemePreference,
} from "@/lib/themePreference";

type Theme = "light" | "dark";

interface ThemeContextValue {
  /** currently applied ("light" or "dark") */
  theme: Theme;
  /** user preference ("light", "dark", or "system") */
  preference: ThemePreference;
  /** set preference to "light", "dark", or "system" */
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_CHANGE_EVENT = "theme-preference-change";

// --- Preference (localStorage) external store ---

function subscribeToPreference(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getPreferenceSnapshot(): ThemePreference {
  return toThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
}

function getPreferenceServerSnapshot(): ThemePreference {
  return "system";
}

// --- System theme (matchMedia) external store ---

function subscribeToSystemTheme(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSystemThemeSnapshot(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSystemThemeServerSnapshot(): Theme {
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore(
    subscribeToPreference,
    getPreferenceSnapshot,
    getPreferenceServerSnapshot,
  );

  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot,
  );

  const theme: Theme = preference === "system" ? systemTheme : preference;

  // Sync data-theme attribute on <html> (external DOM update)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setPreference = useCallback((pref: ThemePreference) => {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  // Memoize so context consumers only re-render when a value actually changes,
  // not on every provider render.
  const value = useMemo(
    () => ({ theme, preference, setPreference }),
    [theme, preference, setPreference],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
