"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { usePersistentState } from "@/hooks/usePersistentState";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { unseenWins } from "@/lib/zeroproof/analytics";
import { formatCents } from "@/lib/zeroproof/format";
import type { ZeroproofBet } from "@/lib/zeroproof/schemas";

const SEEN_KEY = "zeroproof-seen-wins";

/** A few sparkles for the win glow, positioned by percent so they scatter. */
const SPARKS = [
  { top: "12%", left: "8%", delay: "0ms" },
  { top: "70%", left: "18%", delay: "180ms" },
  { top: "26%", left: "86%", delay: "90ms" },
  { top: "62%", left: "72%", delay: "260ms" },
];

/**
 * The celebration the first time I open "Your record" after bets settle in my
 * favour. It keys off wins whose ids aren't in the device-local "seen" set, so
 * a win pops once and then stays quiet. The big number counts up (decorative,
 * whole dollars, aria-hidden); the real total is static text a screen reader
 * reads. Reduced motion drops the sparkles and the count-up jumps to the total.
 */
export default function WinCelebration({ bets }: { bets: ZeroproofBet[] }) {
  const [seen, setSeen] = usePersistentState<string[]>(SEEN_KEY, []);
  const reduced = usePrefersReducedMotion();
  const { ids, count, totalCents } = unseenWins(bets, seen);
  const animated = useCountUp(totalCents, 900, count > 0);

  if (count === 0) return null;

  const dismiss = () =>
    setSeen((prev) => Array.from(new Set([...prev, ...ids])));

  return (
    <div
      role="status"
      className="relative overflow-hidden rounded-2xl border border-success-500/40 bg-success-500/10 p-5"
    >
      {!reduced && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          {SPARKS.map((spark, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-success-500/70"
              style={{ top: spark.top, left: spark.left, animationDelay: spark.delay }}
            />
          ))}
        </span>
      )}

      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-success-700 dark:text-success-300">
            <span aria-hidden="true">🎉 </span>
            {count} new {count === 1 ? "win" : "wins"}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            up{" "}
            <span className="font-mono tabular-nums text-foreground">
              {formatCents(totalCents)}
            </span>{" "}
            since you last looked.
          </p>
        </div>
        <span
          aria-hidden="true"
          className="font-mono text-3xl font-bold tabular-nums text-success-700 dark:text-success-300"
        >
          +${Math.round(animated / 100)}
        </span>
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="relative mt-4 inline-flex h-9 items-center rounded-full border border-success-500/40 bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-success-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        Nice!
      </button>
    </div>
  );
}
