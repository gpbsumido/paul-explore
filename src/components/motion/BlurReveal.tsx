"use client";

import {
  createElement,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { useHubReducedMotion } from "@/app/providers";

/**
 * ReactBits-style "blur text": children resolve from a soft blur as they rise
 * into place. Reimplemented on the design tokens as a CSS keyframe rather than
 * pulling the library in. Under reduced motion the class drops off and the
 * content is simply present, no animation.
 */
export default function BlurReveal({
  children,
  as,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  /** The element to render. Defaults to a span. */
  as?: ElementType;
  className?: string;
  /** Stagger multiple reveals by offsetting the animation start. */
  delayMs?: number;
}) {
  const Tag = (as ?? "span") as ElementType;
  const reduced = useHubReducedMotion();
  const style: CSSProperties | undefined =
    reduced || delayMs === 0 ? undefined : { animationDelay: `${delayMs}ms` };
  return createElement(
    Tag,
    {
      className: `${reduced ? "" : "motion-blur-reveal"} ${className}`.trim(),
      style,
    },
    children,
  );
}
