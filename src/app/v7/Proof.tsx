import { FEATURES, THOUGHTS } from "@/app/_shared/featureData.data";
import { TEST_COUNT } from "@/app/_shared/testCount.generated";
import VitalsLink from "../v5/sections/VitalsLink";
import CycleWord from "./CycleWord";
import styles from "./v7.module.css";

/** Every figure is imported, not typed: the test count is regenerated each build and the rest are array lengths. */
const FIGURES = [
  { value: TEST_COUNT.toLocaleString("en-US"), caption: "tests, written first" },
  { value: String(FEATURES.length), caption: "apps, all of them live" },
  { value: String(THOUGHTS.length), caption: "write-ups on how they were built" },
];

/** Three figures on accent rules, then the one number I don't control. */
export default function Proof() {
  return (
    <section aria-labelledby="proof-title" className={`${styles.shell} ${styles.section} ${styles.ruled}`}>
      <h2 id="proof-title" className={styles.proofTitle}>
        Playful on the outside.
        <br />
        Serious about the <CycleWord />
      </h2>
      <dl className={styles.figures}>
        {FIGURES.map((figure) => (
          <div key={figure.caption}>
            <dt>{figure.caption}</dt>
            <dd>{figure.value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.vitals}>
        <VitalsLink />
      </p>
    </section>
  );
}
