import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Animates a number to `target` over `duration` ms using
 * requestAnimationFrame with ease-out cubic easing. It starts from 0, and
 * when `target` changes it counts on from wherever it is.
 *
 * Pass `inView` to defer the animation until the element is visible
 * (e.g. from Framer Motion's `useInView`). Defaults to `true` so
 * existing call-sites that don't pass it still animate immediately.
 *
 * SSR: returns 0 on the server and through hydration, whatever the visitor's
 * motion preference, since the server can't see it. Reduced motion then
 * returns `target` straight away.
 */
export function useCountUp(
  target: number,
  duration = 800,
  inView = true,
): number {
  const prefersReduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (prefersReduced || duration <= 0 || !inView) return;
    const from = valueRef.current;
    if (from === target) return;

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      valueRef.current = from + (target - from) * eased;
      setValue(valueRef.current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, inView, prefersReduced]);

  return prefersReduced ? target : value;
}
