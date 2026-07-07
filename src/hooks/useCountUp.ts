import { useEffect, useRef, useState } from "react";

/** Check once at module load whether the user prefers reduced motion. */
const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Animates a number from 0 to `target` over `duration` ms using
 * requestAnimationFrame with ease-out cubic easing.
 *
 * Pass `inView` to defer the animation until the element is visible
 * (e.g. from Framer Motion's `useInView`). Defaults to `true` so
 * existing call-sites that don't pass it still animate immediately.
 *
 * SSR: returns `target` on the server so hydration never mismatches.
 * Respects `prefers-reduced-motion`: jumps straight to target.
 */
export function useCountUp(
  target: number,
  duration = 800,
  inView = true,
): number {
  const [value, setValue] = useState(prefersReduced ? target : 0);
  const hasAnimated = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (prefersReduced || duration <= 0 || !inView || hasAnimated.current)
      return;
    hasAnimated.current = true;

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
  }, [target, duration, inView]);

  return value;
}
