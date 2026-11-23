import type { CSSProperties } from "react";
import Link from "next/link";
import { TEST_COUNT } from "@/app/_shared/testCount.generated";
import styles from "./v7.module.css";

/** 6414 as a TypeScript numeric literal: 6_414. */
function numericLiteral(value: number): string {
  return value.toLocaleString("en-US").replaceAll(",", "_");
}

/** The stagger index for the rise animation. CSSProperties has no slot for custom properties, hence the cast. */
function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

/**
 * The hero: the headline on the left, and on the right the same facts written
 * as a TypeScript object in an editor panel. The test count is the generated
 * one, so the object can't overstate it.
 *
 * Each line carries its index in `--i` for the staggered rise, which only runs
 * when motion is allowed.
 */
export default function Hero() {
  const lines = [
    <><span className={styles.kw}>export const</span> paul <span className={styles.pun}>=</span> <span className={styles.pun}>{"{"}</span></>,
    <>  name<span className={styles.pun}>:</span> <span className={styles.str}>&quot;Paul Sumido&quot;</span><span className={styles.pun}>,</span></>,
    <>  role<span className={styles.pun}>:</span> <span className={styles.str}>&quot;Lead Frontend Developer&quot;</span><span className={styles.pun}>,</span></>,
    <>  basedIn<span className={styles.pun}>:</span> <span className={styles.str}>&quot;Toronto, Canada&quot;</span><span className={styles.pun}>,</span></>,
    <>  shippingSince<span className={styles.pun}>:</span> <span className={styles.num}>2017</span><span className={styles.pun}>,</span></>,
    <>  focus<span className={styles.pun}>: [</span><span className={styles.str}>&quot;agentic workflow&quot;</span><span className={styles.pun}>,</span> <span className={styles.str}>&quot;design systems&quot;</span><span className={styles.pun}>,</span> <span className={styles.str}>&quot;experience&quot;</span><span className={styles.pun}>],</span></>,
    <>  testsWrittenFirst<span className={styles.pun}>:</span> <span className={styles.num}>{numericLiteral(TEST_COUNT)}</span><span className={styles.pun}>,</span></>,
    <><span className={styles.pun}>{"}"}</span> <span className={styles.kw}>as const</span><span className={styles.pun}>;</span><span className={styles.caret} aria-hidden="true" /></>,
  ];

  return (
    <div id="hero" className={`${styles.shell} ${styles.hero}`}>
      <div className={styles.heroCopy}>
        <p className={styles.label} style={stagger(0)}>Hi, I&apos;m Paul.</p>
        <h1 className={styles.heroTitle} style={stagger(1)}>
          Ideas into <span className={styles.accent}>interfaces.</span>
        </h1>
        <p className={styles.lede} style={stagger(2)}>
          A collection of things I&apos;ve built, questions I&apos;ve followed, and details I couldn&apos;t leave alone. Come click around.
        </p>
        <div className={styles.ctas} style={stagger(3)}>
          <a className={`${styles.btn} ${styles.btnPrimary}`} href="#work">Explore the work <span aria-hidden="true">↓</span></a>
          <Link className={`${styles.btn} ${styles.btnOutline}`} href="/resume">Resume <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
      <figure className={styles.editor} aria-label="About me, as a TypeScript object">
        <div className={styles.tabs} aria-hidden="true">
          <span className={`${styles.tab} ${styles.tabOn}`}>paul.ts</span>
          <span className={styles.tab}>work.ts</span>
          <span className={styles.lang}>TypeScript</span>
        </div>
        <pre className={styles.code}>
          {lines.map((line, index) => (
            <span key={index} className={styles.line} style={stagger(index)}>{line}</span>
          ))}
        </pre>
      </figure>
    </div>
  );
}
