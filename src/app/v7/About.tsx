import { WORK, EDUCATION } from "../v6/experience";
import styles from "./v7.module.css";

/** "Jun 2023 - Feb 2026" reads as "2023 - 2026" on the timeline. */
function yearsOf(dates: string): string {
  return dates.replace(/[A-Za-z]+\s+/g, "");
}

/**
 * A sticky intro beside the timeline. Every entry comes from the résumé data
 * in v6/experience.ts, so this says nothing the résumé doesn't.
 */
export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className={`${styles.shell} ${styles.section} ${styles.about}`}>
      <div className={styles.aboutIntro}>
        <p className={styles.label}>{"// about"}</p>
        <h2 id="about-title" className={styles.aboutTitle}>Nine years building data-heavy web apps.</h2>
        <p>I&apos;m a front-end lead in Toronto. Most of my work has been dashboards and analytics products in React and TypeScript, with Node.js and Python behind them.</p>
        <p>Charting libraries, drag-and-drop designers, and an AI assistant that answers with live charts.</p>
      </div>
      <ol className={styles.timeline}>
        {[...WORK, ...EDUCATION].map((entry) => (
          <li key={entry.id}>
            <span className={styles.years}>{yearsOf(entry.dates)}</span>
            <h3 className={styles.role}>{entry.title}</h3>
            <span className={styles.place}>{entry.place}</span>
            {entry.points[0] ? <p className={styles.point}>{entry.points[0]}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
