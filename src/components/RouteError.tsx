"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

interface RouteErrorProps {
  reset: () => void;
}

// Simple circle-with-exclamation icon — just enough visual weight to signal
// something broke without making the page feel alarming.
function ErrorIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className="text-muted"
    >
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" />
      <line
        x1="20"
        y1="12"
        x2="20"
        y2="23"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="28" r="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Shared error UI for Next.js route-segment error boundaries.
 *
 * Rendered by each route's error.tsx. Calling `reset` asks Next.js to
 * re-render the segment from scratch — same as a soft refresh of just
 * the failing subtree, without reloading the whole page.
 */
export default function RouteError({ reset }: RouteErrorProps) {
  // A page that throws never produces its metadata, so the document can be
  // left with no title at all — axe rates that serious, and a tab reading
  // "localhost" tells someone with twenty tabs open nothing about which one
  // broke. Only filled in when it is actually empty, so a title that did
  // render higher up is left alone.
  useEffect(() => {
    if (!document.title.trim()) {
      document.title = "Something went wrong";
    }
  }, []);

  return (
    // <main>, not a <div>: this replaces the page, so without it the document
    // has no main landmark and every word on it sits outside any region.
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <ErrorIcon />
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted">
          An unexpected error occurred. The upstream API might be down or the
          request timed out.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
