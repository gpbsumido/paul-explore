"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Whether the reader has asked for less motion.
 *
 * The landing sections get this from framer-motion, but the 3D scenes animate
 * in a render loop that never touches a motion component, which is exactly why
 * they were the two places still ignoring the setting. A plain hook works in
 * both worlds and costs no dependency in a bundle where three.js is already the
 * expensive part.
 *
 * useSyncExternalStore rather than an effect so the value is read during
 * render, and false on the server -- an animated first paint that settles is
 * better than a hydration mismatch.
 */
function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

const getServerSnapshot = (): boolean => false;

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
