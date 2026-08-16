"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "framer-motion";
import { useHubReducedMotion } from "@/app/providers";

export type LoopingDemoProps = {
  children: ReactNode;
  /** Names the thing being replayed, for the button's accessible name. */
  label: string;
  /** How long to wait before running it again. */
  intervalMs?: number;
};

/**
 * Replays a one-shot demo so the gallery actually demonstrates something.
 *
 * The motion primitives animate once, when they scroll into view, and that is
 * the right behaviour on a real page: a headline that re-runs its entrance
 * every few seconds is a distraction, and the entrance is meant to be noticed
 * once. On this page it means the opposite of a demo -- the animation has
 * usually finished before anyone reaches the card, so what a visitor sees is a
 * settled end state and no evidence of what the component does.
 *
 * Replaying is done by remounting the child rather than by reaching into each
 * primitive for a replay API. The primitives stay exactly as production uses
 * them, which is the version worth documenting, and this stays a concern of
 * the gallery.
 *
 * Two rules it keeps. It only ticks while the card is on screen, so a page of
 * demos is not running timers for cards nobody is looking at. And it does not
 * loop at all under reduced motion: that setting is a request for less
 * movement, and a gallery is exactly where a perpetual loop would be worst.
 * The button is there in both cases, so the demo is always available on
 * demand -- which is the accessible way to offer motion rather than impose it.
 */
export default function LoopingDemo({
  children,
  label,
  intervalMs = 4200,
}: LoopingDemoProps) {
  const reducedMotion = useHubReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reducedMotion || !inView) return;
    const timer = setInterval(() => setRun((value) => value + 1), intervalMs);
    return () => clearInterval(timer);
  }, [reducedMotion, inView, intervalMs]);

  return (
    <div ref={ref} className="flex w-full items-center justify-between gap-3">
      <div key={run} className="min-w-0">
        {children}
      </div>
      <button
        type="button"
        // The visible word plus a hidden span would compute to
        // "ReplayText reveal": accessible-name computation trims each child
        // element's text before joining, so a space tucked inside the span
        // disappears. An explicit label sidesteps it, and still opens with the
        // visible word so it satisfies label-in-name.
        aria-label={`Replay ${label}`}
        onClick={() => setRun((value) => value + 1)}
        className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
      >
        Replay
      </button>
    </div>
  );
}
