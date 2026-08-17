"use client";

import { useCallback, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { useTextScramble } from "./useTextScramble";
import type { TextRevealTag } from "./TextReveal";

export type TextScrambleProps = {
  /** The string to decode toward. */
  text: string;
  /** "mount" decodes straight away; "inView" waits until it is on screen. */
  trigger?: "mount" | "inView";
  /** Milliseconds per settled character. */
  speedMs?: number;
  /** Element to render. Defaults to a span. */
  as?: TextRevealTag;
  className?: string;
};

/**
 * Text that decodes itself, one character at a time, left to right.
 *
 * No ARIA on purpose. The settled string is what renders on the server and what
 * reduced motion keeps, so the element already carries its real text; adding an
 * aria-label to a generic span would only invent a second, competing name.
 */
export default function TextScramble({
  text,
  trigger = "inView",
  speedMs = 40,
  as,
  className,
}: TextScrambleProps) {
  const Tag = as ?? "span";
  const ref = useRef<HTMLElement | null>(null);
  const setRef = useCallback((el: HTMLElement | null) => {
    ref.current = el;
  }, []);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const { display, start } = useTextScramble({ text, trigger, speedMs });

  useEffect(() => {
    if (trigger === "inView" && inView) start();
  }, [trigger, inView, start]);

  return (
    <Tag ref={setRef} className={className}>
      {display}
    </Tag>
  );
}
