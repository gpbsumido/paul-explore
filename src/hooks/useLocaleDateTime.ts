"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * Format an ISO timestamp with `toLocaleString()` on the client only.
 *
 * Locale and timezone differ between the server and the browser, so formatting
 * during render causes a hydration mismatch. useSyncExternalStore renders the
 * server snapshot (an empty string) first and swaps to the client-formatted
 * value after hydration — no mismatch, and no setState-in-effect.
 */
export function useLocaleDateTime(iso: string): string {
  return useSyncExternalStore(
    noop,
    () => new Date(iso).toLocaleString(),
    () => "",
  );
}
