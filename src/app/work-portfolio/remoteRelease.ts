"use client";

import { useSyncExternalStore } from "react";

// Which remote release is mounted on this page. The island writes it once the
// remote is up; the header chip reads it. Two separate parts of the tree, so a
// tiny external store rather than threading it through the server page.
let release: string | null = null;
const listeners = new Set<() => void>();

/** Record the remote release that just mounted (null when it unmounts). */
export function setRemoteRelease(next: string | null) {
  release = next;
  listeners.forEach((notify) => notify());
}

/** The mounted remote's release, or null before it mounts. */
export function useRemoteRelease(): string | null {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => release,
    () => null,
  );
}
