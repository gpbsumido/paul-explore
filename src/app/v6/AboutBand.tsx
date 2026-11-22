import Image from "next/image";
import Link from "next/link";
import { previewSrc } from "../v5/featured";
import { featureFor, PHOTO_STACK_IDS } from "./picks";
import TypedHeadline from "./TypedHeadline";
import ExperienceCard from "./ExperienceCard";
import styles from "./playground.module.css";

/**
 * Who's behind the work, between the projects and the proof.
 *
 * The photo stack is lifted from a reference site, but where that one shows
 * holiday photos these are screens from this site. Each card opens its app,
 * and the stack fans out on hover or when a card takes focus. The experience
 * card under it is my résumé's timeline.
 */
export default function AboutBand() {
  return (
    <section id="about" aria-labelledby="about-title" className={styles.about}>
      <p className={styles.eyebrow}>03 / The person behind it</p>
      <TypedHeadline id="about-title" text="Nine years building data-heavy web apps" />
      <ul aria-label="Snapshots from the site" className={styles.photoStack}>
        {PHOTO_STACK_IDS.map((id) => {
          const feature = featureFor(id);
          return (
            <li key={id}>
              <Link href={feature.href} aria-label={`Open ${feature.title}`}>
                <Image src={previewSrc(id, "light")} alt="" width={1280} height={800} sizes="(max-width: 700px) 70vw, 22rem" className={styles.lightImage} />
                <Image src={previewSrc(id, "dark")} alt="" width={1280} height={800} sizes="(max-width: 700px) 70vw, 22rem" className={styles.darkImage} />
              </Link>
            </li>
          );
        })}
      </ul>
      <div className={styles.aboutCopy}>
        <p>I&rsquo;m a front-end lead in Toronto. Most of my work has been dashboards and analytics products in React and TypeScript, with Node.js and Python behind them: charting libraries, drag-and-drop designers, and an AI assistant that answers with live charts.</p>
        <p>What I care about shows up on this page as numbers you can check: tests written first, accessibility treated as a requirement, and Core Web Vitals measured from real visits.</p>
      </div>
      <ExperienceCard />
    </section>
  );
}
