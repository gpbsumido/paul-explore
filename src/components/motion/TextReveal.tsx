"use client";

import { useCallback, useRef } from "react";
import { useInView } from "framer-motion";

/**
 * Tags this is meant to wrap. A bare ElementType would be the union of every
 * element, which TypeScript then intersects into `never` props, and it would
 * also let callers reveal an `<input>`, which makes no sense.
 */
export type TextRevealTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";

export type TextRevealProps = {
  /** The string to reveal. Kept as a plain string so the split stays honest. */
  children: string;
  /** Element to render. Defaults to a span. */
  as?: TextRevealTag;
  /** Split granularity. Words read better for headlines. */
  per?: "word" | "char";
  /** Delay between each part, in milliseconds. */
  staggerMs?: number;
  /** Delay before the first part moves, in milliseconds. */
  delay?: number;
  className?: string;
};

/**
 * A headline that rises into place a word (or letter) at a time once it scrolls
 * into view.
 *
 * The whole string is in the server HTML at full opacity. The rise is a CSS
 * animation switched on by a data attribute after the element enters the
 * viewport, which is the same trick `.reveal-up` uses in globals.css: framer's
 * `initial` would ship the largest above-the-fold text as opacity:0 in the
 * markup, and LCP then waits for hydration.
 *
 * Reduced motion is handled in CSS, so there is no second code path to keep
 * in step here.
 */
export default function TextReveal({
  children,
  as,
  per = "word",
  staggerMs = 60,
  delay = 0,
  className,
}: TextRevealProps) {
  const Tag = as ?? "span";
  const ref = useRef<HTMLElement | null>(null);
  // A callback ref rather than the object: each tag in the union wants a ref to
  // its own element type, and a function taking the base HTMLElement is
  // assignable to all of them where a RefObject<HTMLElement> is not.
  const setRef = useCallback((el: HTMLElement | null) => {
    ref.current = el;
  }, []);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const parts = per === "word" ? children.split(" ") : [...children];

  return (
    <Tag
      ref={setRef}
      className={className}
      data-revealed={inView ? "true" : undefined}
    >
      {parts.flatMap((part, index) => {
        const span = (
          <span
            key={`part-${index}`}
            className="motion-reveal-part"
            style={{ animationDelay: `${delay + index * staggerMs}ms` }}
          >
            {part}
          </span>
        );
        // The separator is a bare text node directly under the element, not
        // wrapped. Accessible-name computation trims each child element's text
        // before joining, so a space tucked inside a wrapper span disappears
        // and the name comes out as "Verdigrisandember".
        return per === "word" && index < parts.length - 1
          ? [span, " "]
          : [span];
      })}
    </Tag>
  );
}
