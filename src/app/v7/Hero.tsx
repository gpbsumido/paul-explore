import { Fragment, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { TEST_COUNT } from "@/app/_shared/testCount.generated";
import CodeEditor from "./CodeEditor";
import { editorWorkLinks } from "./picks";
import styles from "./v7.module.css";

/** 6414 as a TypeScript numeric literal: 6_414. */
function numericLiteral(value: number): string {
  return value.toLocaleString("en-US").replaceAll(",", "_");
}

/** The stagger index for the rise animation. CSSProperties has no slot for custom properties, hence the cast. */
function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

/** One numbered editor line per entry. Each carries its index in `--i` for the staggered rise, which only runs when motion is allowed. */
function codeLines(lines: ReactNode[]): ReactNode {
  return lines.map((line, index) => (
    <span key={index} className={styles.line} style={stagger(index)}>{line}</span>
  ));
}

/**
 * The hero: the headline on the left, and on the right an editor panel with
 * two files. paul.ts has the same facts as a TypeScript object, with the
 * generated test count so it can't overstate it; work.ts lists projects the
 * grid below doesn't show, each one a link.
 */
export default function Hero() {
  const paulLines = [
    <><span className={styles.kw}>export const</span> paul <span className={styles.pun}>=</span> <span className={styles.pun}>{"{"}</span></>,
    <>  name<span className={styles.pun}>:</span> <span className={styles.str}>&quot;Paul Sumido&quot;</span><span className={styles.pun}>,</span></>,
    <>  role<span className={styles.pun}>:</span> <span className={styles.str}>&quot;Lead Frontend Developer&quot;</span><span className={styles.pun}>,</span></>,
    <>  basedIn<span className={styles.pun}>:</span> <span className={styles.str}>&quot;Toronto, Canada&quot;</span><span className={styles.pun}>,</span></>,
    <>  shippingSince<span className={styles.pun}>:</span> <span className={styles.num}>2017</span><span className={styles.pun}>,</span></>,
    <>  focus<span className={styles.pun}>: [</span><span className={styles.str}>&quot;agentic workflow&quot;</span><span className={styles.pun}>,</span> <span className={styles.str}>&quot;design systems&quot;</span><span className={styles.pun}>,</span> <span className={styles.str}>&quot;experience&quot;</span><span className={styles.pun}>],</span></>,
    <>  testsWrittenFirst<span className={styles.pun}>:</span> <span className={styles.num}>{numericLiteral(TEST_COUNT)}</span><span className={styles.pun}>,</span></>,
    <><span className={styles.pun}>{"}"}</span> <span className={styles.kw}>as const</span><span className={styles.pun}>;</span><span className={styles.caret} aria-hidden="true" /></>,
  ];

  const workLines = [
    <><span className={styles.kw}>export const</span> work <span className={styles.pun}>= [</span></>,
    ...editorWorkLinks().map(({ title, href, note }) => (
      <Fragment key={href}>  <span className={styles.str}>&quot;<Link href={href} className={styles.codeLink}>{title}</Link>&quot;</span><span className={styles.pun}>,</span> <span className={styles.comment}>{`// ${note}`}</span></Fragment>
    )),
    <><span className={styles.pun}>]</span> <span className={styles.kw}>as const</span><span className={styles.pun}>;</span><span className={styles.caret} aria-hidden="true" /></>,
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
      <CodeEditor
        files={[
          { name: "paul.ts", code: codeLines(paulLines) },
          { name: "work.ts", code: codeLines(workLines) },
        ]}
      />
    </div>
  );
}
