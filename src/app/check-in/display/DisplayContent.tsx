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
  const [remaining, setRemaining] = useState<number | null>(null);

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

  const secondsFromServer = query.data?.secondsRemaining ?? null;

  // Restart the countdown whenever a fresh code lands.
  useEffect(() => {
    if (secondsFromServer === null) return;
    setRemaining(secondsFromServer);
  }, [secondsFromServer, query.dataUpdatedAt]);

  // Tick down, and refetch the moment this code is due to be replaced.
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      void query.refetch();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(timer);
  }, [remaining, query]);

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
        New code in {formatRemaining(remaining ?? query.data.secondsRemaining)}
      </p>
      <p className="max-w-sm text-xs text-muted">
        Volunteers: open the check-in link and type these six digits.
      </p>
    </div>
  );
}
