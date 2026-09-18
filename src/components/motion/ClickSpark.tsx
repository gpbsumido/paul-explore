"use client";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { useHubReducedMotion } from "@/app/providers";

/**
 * ReactBits-style "click spark": a ring of rays bursts outward from the press
 * point, then clears itself when the animation ends. Wrap it around a control —
 * it doesn't intercept the child's own click, it just decorates the press.
 * Under reduced motion nothing is spawned.
 */
type Burst = { id: number; x: number; y: number };

export default function ClickSpark({
  children,
  className = "",
  count = 8,
}: {
  children: ReactNode;
  className?: string;
  /** How many rays fly out per burst. */
  count?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // A monotonic id keeps React keys stable without a clock or randomness.
  const seq = useRef(0);
  const reduced = useHubReducedMotion();
  const [bursts, setBursts] = useState<Burst[]>([]);

  const spawn = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    seq.current += 1;
    setBursts((prev) => [
      ...prev,
      { id: seq.current, x: event.clientX - rect.left, y: event.clientY - rect.top },
    ]);
  };

  const clear = (id: number) =>
    setBursts((prev) => prev.filter((burst) => burst.id !== id));

  return (
    <span
      ref={ref}
      onPointerDown={spawn}
      className={`motion-spark-host ${className}`.trim()}
    >
      {children}
      {bursts.map((burst) => (
        <span
          key={burst.id}
          aria-hidden="true"
          className="motion-spark"
          style={{ left: burst.x, top: burst.y }}
          onAnimationEnd={() => clear(burst.id)}
        >
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className="motion-spark__ray"
              style={{ "--angle": `${(360 / count) * i}deg` } as CSSProperties}
            />
          ))}
        </span>
      ))}
    </span>
  );
}
