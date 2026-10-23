"use client";

import { useEffect, useRef, useState } from "react";
import { clock } from "./format";

const TICK_MS = 250;

/** What the clock announces as it runs down: nothing, then a minute, then thirty seconds. */
const warningFor = (remainingMs: number) => {
  if (remainingMs <= 0) return "Time's up. Your answers have been handed in.";
  if (remainingMs <= 30_000) return "30 seconds left.";
  if (remainingMs <= 60_000) return "1 minute left.";
  return "";
};

/**
 * Hard's clock. It owns its own tick, so only the clock re-renders four times
 * a second rather than the whole page, and it calls `onExpire` once, with the
 * moment time ran out, when it reaches zero. After the attempt finishes it
 * shows the time that was left.
 */
export default function Countdown({
  startedAt,
  limitMs,
  finishedAt,
  onExpire,
}: {
  startedAt: number;
  limitMs: number;
  finishedAt: number | null;
  onExpire: (at: number) => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  // Read through a ref, so a new callback from the page doesn't restart the clock.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (finishedAt !== null) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t - startedAt >= limitMs) {
        clearInterval(id);
        onExpireRef.current(startedAt + limitMs);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [startedAt, limitMs, finishedAt]);

  const remaining = Math.max(0, limitMs - ((finishedAt ?? now) - startedAt));

  return (
    <>
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-muted">Time left</p>
        <span role="timer" aria-label="Time left" className="font-mono text-2xl font-bold text-foreground">
          {clock(remaining)}
        </span>
      </div>
      <p aria-live="polite" className="basis-full text-[14px] font-semibold text-foreground empty:hidden">
        {warningFor(remaining)}
      </p>
    </>
  );
}
