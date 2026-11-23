"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import styles from "./v7.module.css";

const WORDS = ["details.", "tests.", "accessibility.", "performance.", "edge cases."];

/**
 * The last word of the proof headline, cycling through what the polish hides.
 * Screen readers get the first word once and never hear it change, and under
 * reduced motion it stays on the first word.
 */
export default function CycleWord() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % WORDS.length), 2200);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  const shownWord = prefersReducedMotion ? WORDS[0] : WORDS[index];

  return (
    <>
      <span className="sr-only">{WORDS[0]}</span>
      {/* Keyed so each swap remounts and replays the rise. */}
      <span key={shownWord} className={styles.cycle} aria-hidden="true">
        {shownWord}
      </span>
    </>
  );
}
