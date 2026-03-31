import { useEffect, useRef, useState } from "react";

/** Check once at module load whether the user prefers reduced motion. */
const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Animates a number from 0 to `target` over `duration` ms using
 * requestAnimationFrame with ease-out cubic easing.
 *
 * Respects `prefers-reduced-motion`: if the user has it enabled,
 * the value jumps straight to the target with no animation.
 */
export function useCountUp(target: number, duration = 800): number {
  // when reduced motion is on, skip the animation entirely
  const [value, setValue] = useState(prefersReduced ? target : 0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (prefersReduced || duration <= 0) return;

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}
