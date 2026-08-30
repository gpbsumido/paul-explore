"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

type CodeResponse = {
  siteName: string;
  code: string;
  secondsRemaining: number;
  periodSeconds: number;
};

/** m:ss, because a bare "84" reads as a quantity rather than a countdown. */
function formatRemaining(seconds: number): string {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

/**
 * The screen that sits at the entrance.
 *
 * It refetches exactly when the code expires rather than on a fixed poll: the
 * server says how long this one has left, so there is no window where the wall
 * shows one code and the server expects another.
 *
 * The one rule this page must never break is showing a code it cannot vouch
 * for. On any failure it hides the digits and says so, because a volunteer
 * typing a dead code blames themselves, not the display.
 */
export default function DisplayContent() {
  const siteId = useSearchParams().get("site");

  const query = useQuery({
    queryKey: ["check-in-code", siteId],
    queryFn: async (): Promise<CodeResponse> => {
      const res = await fetch(`/api/check-in/sites/${siteId}/code`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          res.status === 404
            ? "That site was not found, or you don't own it."
            : (body.message ?? "Can't reach the server."),
        );
      }
      return res.json();
    },
    enabled: Boolean(siteId),
    // Never serve a cached code: this screen is the source of truth people read.
    gcTime: 0,
    staleTime: 0,
  });

  const { refetch } = query;

  if (!siteId) {
    return (
      <p className="text-sm text-muted">
        This link doesn&apos;t say which site to display. Open it from your sites
        list.
      </p>
    );
  }

  if (query.isError) {
    return (
      <p
        role="alert"
        className="text-lg text-warning-600 dark:text-warning-300"
      >
        {(query.error as Error).message} The code is hidden until this reconnects
        — don&apos;t read the last one out.
      </p>
    );
  }

  if (query.isLoading || !query.data) {
    return <p className="text-sm text-muted">Getting the current code…</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10 text-center">
      <p className="text-sm uppercase tracking-widest text-muted">
        {query.data.siteName}
      </p>
      <p
        // Tabular figures so the digits don't jump as the code changes, and
        // large enough to read from across a room.
        className="font-mono text-6xl font-bold tabular-nums tracking-[0.2em] text-foreground sm:text-8xl"
        aria-label={`Arrival code ${query.data.code.split("").join(" ")}`}
      >
        {query.data.code}
      </p>
      <p className="text-sm text-muted" aria-live="off">
        {/* Keyed on the fetch, so a fresh code remounts this with its own
            starting number instead of the parent writing state to reset it. */}
        <Countdown
          key={query.dataUpdatedAt}
          seconds={query.data.secondsRemaining}
          onExpire={refetch}
        />
      </p>
      <p className="max-w-sm text-xs text-muted">
        Volunteers: open the check-in link and type these six digits.
      </p>
    </div>
  );
}

/**
 * Counts one code down and asks for the next when it runs out.
 *
 * Its own component so the countdown restarts by remounting rather than by an
 * effect writing state, which is both simpler and what the lint rules want.
 */
function Countdown({
  seconds,
  onExpire,
}: {
  seconds: number;
  onExpire: () => void;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) {
      onExpire();
      return;
    }
    const timer = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, onExpire]);

  return <>New code in {formatRemaining(left)}</>;
}
