import { SHELL } from "../v5/shell";
import { STACK } from "./stack";
import styles from "./playground.module.css";

/**
 * The tools behind the page, as a plain row of pills.
 *
 * It's a static list rather than a scrolling ticker on purpose. A strip that
 * moves on its own for more than five seconds needs a way to pause it, and the
 * ticker only stops on hover, which leaves keyboard visitors with no off switch.
 */
export default function StackStrip() {
  return (
    <section aria-labelledby="stack-title" className={`${SHELL} ${styles.stack}`}>
      <h3 id="stack-title" className={styles.eyebrow}>Built on</h3>
      <ul aria-label="What this site is built on" className={styles.stackList}>
        {STACK.map(({ pkg, label }) => (
          <li key={pkg}>{label}</li>
        ))}
      </ul>
    </section>
  );
}
