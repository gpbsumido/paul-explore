"use client";

import { useState, useEffect } from "react";

const getIsMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 767px)").matches;

/**
 * Returns true when the viewport is phone-width (< 768 px).
 * Reads matchMedia synchronously on first render to avoid a flicker frame.
 * Updates reactively if the user resizes across the breakpoint.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
