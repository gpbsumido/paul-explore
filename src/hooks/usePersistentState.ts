"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/**
 * useState that persists to localStorage under `key`. The initial value is
 * read from storage lazily (client-only; falls back to `initial` on the server
 * or when nothing is stored), and every change is written back. Intended for
 * client-rendered UI like the work-portfolio demos, not server-rendered pages.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota / unavailable storage
    }
  }, [key, state]);

  return [state, setState];
}
