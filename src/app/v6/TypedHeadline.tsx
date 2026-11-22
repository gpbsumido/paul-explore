"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import styles from "./playground.module.css";

const MS_PER_CHARACTER = 45;

type TypedHeadlineProps = { id: string; text: string };

/**
 * A heading that types itself out once, the first time it scrolls into view,
 * with an accent bar under it that grows as it types.
 *
 * Screen readers get the whole sentence from the first render; only the
 * aria-hidden layer types. An invisible copy of the full text holds the space,
 * so nothing below it moves while the letters arrive. Reduced motion skips the
 * typing and shows the sentence whole.
 */
export default function TypedHeadline({ id, text }: TypedHeadlineProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [typedLength, setTypedLength] = useState(0);

  useEffect(() => {
    const heading = headingRef.current;
    if (prefersReducedMotion || !heading) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || timer) return;
      observer.disconnect();
      timer = setInterval(() => {
        setTypedLength((length) => {
          if (length + 1 >= text.length) clearInterval(timer);
          return Math.min(length + 1, text.length);
        });
      }, MS_PER_CHARACTER);
    });
    observer.observe(heading);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [prefersReducedMotion, text]);

  const shownLength = prefersReducedMotion ? text.length : typedLength;
  const typing = shownLength < text.length;

  return (
    <div className={styles.typedHeadline}>
      <h2 id={id} ref={headingRef} className={styles.aboutTitle}>
        <span className="sr-only">{text}</span>
        <span aria-hidden="true" className={styles.typedGhost}>{text}</span>
        <span aria-hidden="true" className={styles.typedText}>
          <span data-typed>{text.slice(0, shownLength)}</span>
          {typing && <span className={styles.caret} />}
        </span>
      </h2>
      <span aria-hidden="true" className={styles.accentBar} style={{ scale: `${Math.max(shownLength / text.length, 0.08)} 1` }} />
    </div>
  );
}
