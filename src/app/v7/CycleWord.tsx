"use client";

import { useEffect, useState } from "react";
import styles from "./v7.module.css";

const WORDS = ["details.", "tests.", "accessibility.", "performance.", "edge cases."];

/**
 * The last word of the proof headline, cycling through what the polish hides.
 * Screen readers get the first word once and never hear it change, and under
 * reduced motion it never starts cycling at all.
 */
export default function CycleWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % WORDS.length), 2200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <span className="sr-only">{WORDS[0]}</span>
      {/* Keyed so each swap remounts and replays the rise. */}
      <span key={index} className={styles.cycle} aria-hidden="true">
        {WORDS[index]}
      </span>
    </>
  );
}
