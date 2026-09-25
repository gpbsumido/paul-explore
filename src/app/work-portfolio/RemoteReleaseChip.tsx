"use client";

import Link from "next/link";
import { useRemoteRelease } from "./remoteRelease";

/**
 * A small pill in the page header naming the remote release on screen, linked
 * to the write-up on how the page is put together. Without it the split is
 * invisible, which is the point for a visitor and the opposite of the point
 * for anyone checking which build they're looking at.
 */
export default function RemoteReleaseChip() {
  const release = useRemoteRelease();
  if (!release) return null;
  return (
    <Link
      href="/thoughts/micro-frontends"
      className="hidden rounded-full border border-dashed border-border px-2 py-0.5 font-mono text-[11px] text-muted transition-colors hover:text-foreground sm:inline-flex"
      aria-label={`remote v${release}, how this page is built`}
    >
      remote v{release}
    </Link>
  );
}
