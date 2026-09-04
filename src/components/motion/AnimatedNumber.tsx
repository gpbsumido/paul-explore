"use client";

import { useRef, useSyncExternalStore } from "react";
import { useInView } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";
import { useHubReducedMotion } from "@/app/providers";

/**
 * True while rendering on the server and through hydration, false afterwards.
 *
 * This is what lets the markup carry the real figure while the count-up only
 * takes over on the client. Doing it with useState plus an effect would set
 * state during the first commit and cost an extra render of the whole subtree.
 */
const noopSubscribe = () => () => {};
const useIsServerRender = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => false,
    () => true,
  );

/**
 * How the figure reads. A closed, serializable set rather than a format
 * function on purpose: the function forced every caller across the client
 * boundary, when the component's whole point is that a server component can
 * render the final value. `plain` is the raw integer, `comma` groups thousands.
 */
export type NumberFormat = "plain" | "comma";

const FORMATTERS: Record<NumberFormat, (value: number) => string> = {
  plain: (n) => String(n),
  comma: (n) => n.toLocaleString("en-US"),
};

export type AnimatedNumberProps = {
  /** The number to land on. */
  value: number;
  /** How the figure reads. Defaults to the raw integer. */
  format?: NumberFormat;
  /** How long the count takes, in milliseconds. */
  durationMs?: number;
  className?: string;
};

/**
 * A number that counts up to its value when it scrolls into view.
 *
 * The server renders the final value, so the real figure is in the HTML for
 * anyone who never runs the JS, and a crawler never reads a zero. The count
 * only takes over after mount, by which point the element is off screen unless
 * it is already in view.
 *
 * Reduced motion comes from the shared context rather than useCountUp's own
 * check: that hook reads the media query once at module import, which is too
 * early to be reliable.
 */
export default function AnimatedNumber({
  value,
  format = "plain",
  durationMs = 900,
  className,
}: AnimatedNumberProps) {
  const render = FORMATTERS[format];
  const reducedMotion = useHubReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const isServerRender = useIsServerRender();
  const counted = useCountUp(value, durationMs, inView);

  // Rounded before formatting: the count-up interpolates, and a float run
  // through toLocaleString sprays decimals across the figure mid-count.
  const display = Math.round(
    isServerRender || reducedMotion ? value : counted,
  );

  return (
    <span ref={ref} className={className}>
      {render(display)}
    </span>
  );
}
