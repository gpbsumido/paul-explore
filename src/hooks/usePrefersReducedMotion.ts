"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Whether the reader has asked for less motion. The one source for that on the
 * site: components, landing sections and the 3D scenes all read it here.
 *
 * Read through useSyncExternalStore rather than framer-motion's
 * useReducedMotion. The server can't see the preference, so it renders full
 * motion; framer's hook read matchMedia on the client's very first render,
 * which made a reduced-motion visitor's hydration disagree with that HTML. The
 * server snapshot below is what React uses while hydrating, so both sides
 * agree, and the real preference lands on the render straight after.
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
