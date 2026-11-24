import { stackWithVersions } from "./picks";
import styles from "./v7.module.css";

const INTERESTS = [
  "dashboards",
  "design systems",
  "data visualization",
  "accessibility",
  "performance",
  "test-first",
  "3D on the web",
];

/**
 * Two rails: what the site actually runs on, as package@version read from
 * package.json, then what I like working on. Each rail is doubled so the
 * -50% slide loops without a seam, which is why both are hidden from assistive
 * tech and summarised once in a sentence instead.
 */
export default function StackMarquee() {
  const stack = stackWithVersions();
  const packages = (copy: string) =>
    stack.map(({ pkg, version }) => (
      <span key={`${copy}-${pkg}`}>
        {pkg}
        <span className={styles.at}>@</span>
        <span className={styles.ver}>{version}</span>
      </span>
    ));
  const interests = (copy: string) =>
    INTERESTS.map((interest) => <span key={`${copy}-${interest}`}>{`// ${interest}`}</span>);

  return (
    <div className={styles.marquee}>
      <div className={styles.track} aria-hidden="true">
        {packages("a")}
        {packages("b")}
      </div>
      <div className={`${styles.track} ${styles.trackAlt}`} aria-hidden="true">
        {interests("a")}
        {interests("b")}
      </div>
      <p className="sr-only">
        Built with {stack.map(({ label }) => label).join(", ")}. Interested in {INTERESTS.join(", ")}.
      </p>
    </div>
  );
}
