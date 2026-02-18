import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Tracks whether an element has scrolled into the viewport.
 *
 * Returns a ref to attach to the target element and a boolean that
 * flips to `true` once the element is visible. The boolean never
 * reverts to `false` — once triggered, the observer disconnects so
 * the entrance animation only fires once.
 *
 * @param threshold - fraction of the element that must be visible
 *                    before it counts as "in view" (0–1, default 0.15)
 */
export function useInView(
  threshold = 0.15,
): [RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}
