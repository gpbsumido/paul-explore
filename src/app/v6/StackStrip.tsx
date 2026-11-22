"use client";

import { useRef } from "react";
import { SHELL } from "../v5/shell";
import { STACK } from "./stack";
import { ArrowRight } from "./arrows";
import styles from "./playground.module.css";

/**
 * The tools behind the page, as a rail of chips inside a phone.
 *
 * It looks like a ticker but never moves on its own. A strip that scrolls by
 * itself for more than five seconds needs a way to pause it, and the design
 * system's ticker only stops on hover, which leaves keyboard visitors with no
 * off switch. Here the visitor swipes, scrolls, tabs in and uses the arrow
 * keys, or presses the two buttons.
 */
export default function StackStrip() {
  const railRef = useRef<HTMLUListElement>(null);
  const scrollRail = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(rail.clientWidth * 0.8, 120) });
  };

  return (
    <section aria-labelledby="stack-title" className={`${SHELL} ${styles.stack}`}>
      <div className={styles.stackCopy}>
        <h3 id="stack-title">Built on</h3>
        <p>The runtime this site ships on and the test stack that keeps it honest. Every name here is checked against package.json.</p>
      </div>
      <div className={styles.phone}>
        <div className={styles.phoneScreen}>
          <ul ref={railRef} tabIndex={0} aria-label="What this site is built on" className={styles.stackList}>
            {STACK.map(({ pkg, label }) => (
              <li key={pkg}>{label}</li>
            ))}
          </ul>
          <div className={styles.railButtons}>
            <button type="button" aria-label="Scroll the tools back" onClick={() => scrollRail(-1)}><ArrowRight size={14} className={styles.arrowBack} /></button>
            <button type="button" aria-label="Scroll the tools forward" onClick={() => scrollRail(1)}><ArrowRight size={14} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
