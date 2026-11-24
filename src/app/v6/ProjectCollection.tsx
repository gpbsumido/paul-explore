"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, ClickSpark, RubberSegment } from "@paul-portfolio/react";
import { FEATURES } from "@/app/_shared/featureData.data";
import { previewSrc } from "../v5/featured";
import styles from "./playground.module.css";
import { ArrowUpRight } from "./arrows";
import { featureFor, PROJECT_PICKS } from "./picks";

const FILTERS = ["All", "Interfaces", "Systems", "Play"];

/**
 * Two splits, then a wide row. Three image-beside-text rows in a row start to
 * read as a template, so every third project gets the full width instead.
 */
const LAYOUTS = ["left", "right", "wide"] as const;

/**
 * The hub entry behind a project pick. Every row promises a write-up link, so a
 * feature with nothing written about it is a typo. Say which instead of quietly
 * rendering a row with a missing link. The hero and tiles share featureFor and
 * don't need a write-up, so the check lives here rather than in picks.ts.
 */
function projectFor(id: string) {
  const feature = featureFor(id);
  const { thoughtsHref } = feature;
  if (!thoughtsHref) throw new Error(`ProjectCollection picks "${id}", which has no write-up to link`);
  return { ...feature, thoughtsHref };
}

export default function ProjectCollection() {
  const [filter, setFilter] = useState("All");
  const projects = PROJECT_PICKS.filter((pick) => filter === "All" || pick.category === filter);

  return (
    <>
    <section id="work" className={styles.work} aria-labelledby="work-title">
      <div className={styles.sectionHeading}>
        <div><p className={styles.eyebrow}>02 / Open for exploring</p><h2 id="work-title">Pick a rabbit hole<span className={styles.accent}>.</span></h2></div>
        <p>Working apps. Small obsessions.<br />Each one has a write-up behind it.</p>
      </div>
      <div className={styles.filterBar}>
        <fieldset><legend className="sr-only">Filter projects</legend><RubberSegment segments={FILTERS} value={filter} onChange={setFilter} /></fieldset>
        <span aria-live="polite" aria-atomic="true" className={styles.count}>{String(projects.length).padStart(2, "0")} projects / {filter}</span>
      </div>
      <ul className={styles.showcase} aria-label="Projects">
        {projects.map((pick, index) => {
          const feature = projectFor(pick.id);
          const layout = LAYOUTS[index % LAYOUTS.length];
          // A wide row's screenshot spans the page, so the beside-text 60vw
          // would hand it an image that gets stretched.
          const imageSizes = layout === "wide" ? "100vw" : "(max-width: 900px) 92vw, 60vw";
          return (
            <li key={pick.id} className={styles.showcaseRow} data-layout={layout}>
              {/* The screenshot opens the app too, but it's the same place as
                  the Open link, so it stays out of the tab order and the
                  accessibility tree rather than being announced twice. */}
              <Link href={feature.href} className={styles.showcaseMedia} tabIndex={-1} aria-hidden="true">
                <Image src={previewSrc(pick.id, "light")} alt="" width={1280} height={800} sizes={imageSizes} className={styles.lightImage} />
                <Image src={previewSrc(pick.id, "dark")} alt="" width={1280} height={800} sizes={imageSizes} className={styles.darkImage} />
              </Link>
              <div className={styles.showcaseText}>
                <div>
                  <p className={styles.showcaseCaption}>{pick.number} / {pick.caption}</p>
                  <h3>{feature.title}</h3>
                  <span className={styles.showcaseCategory}>{pick.category}</span>
                </div>
                <div>
                  <p className={styles.showcaseNote}>{pick.note}</p>
                  <div className={styles.showcaseLinks}>
                    <Link href={feature.href} aria-label={`Open ${feature.title}`}>Open <ArrowUpRight size={14} /></Link>
                    <Link href={feature.thoughtsHref} aria-label={`Read the ${feature.title} write-up`}>Write-up <ArrowUpRight size={14} /></Link>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
    <div className={styles.collectionFooter}><p>This is just the shortlist. There are {FEATURES.length} places to go.</p><ClickSpark><Button href="/surprise" variant="outline">Surprise me <ArrowUpRight size={14} /></Button></ClickSpark><Button href="/design-system" variant="ghost">Explore the components <ArrowUpRight size={14} /></Button></div>
    </>
  );
}
