"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, ClickSpark, RubberSegment } from "@paul-portfolio/react";
import { FEATURES } from "@/app/_shared/featureData.data";
import { previewSrc } from "../v5/featured";
import styles from "./playground.module.css";
import { ArrowUpRight } from "./arrows";

const FILTERS = ["All", "Interfaces", "Systems", "Play"];
const PICKS = [
  { id: "work-portfolio", category: "Interfaces", note: "From shipped product to hands-on demo.", caption: "Product work", number: "01" },
  { id: "design-system", category: "Systems", note: "The building blocks behind everything here.", caption: "Design × engineering", number: "02" },
  { id: "world", category: "Play", note: "Take the scenic route through a tiny Toronto.", caption: "An explorable world", number: "03" },
  { id: "operator", category: "Interfaces", note: "A retail fleet, with every detail one click away.", caption: "Tools for real decisions", number: "04" },
  { id: "flags", category: "Systems", note: "Ship it. Roll it out. Keep a way back.", caption: "Release control", number: "05" },
  { id: "vitals", category: "Systems", note: "This site’s performance, measured in the wild.", caption: "The reality check", number: "06" },
  { id: "pokemon", category: "Play", note: "Three little apps sharing one Pokémon dataset.", caption: "Data, three ways", number: "07" },
  { id: "particles", category: "Play", note: "A constellation that leans toward your cursor.", caption: "A physics toy", number: "08" },
  { id: "research", category: "Interfaces", note: "A reader for the papers I keep going back to.", caption: "Papers, organized", number: "09" },
  { id: "learn", category: "Interfaces", note: "Notes and demos from things I taught myself.", caption: "Self-taught, in public", number: "10" },
  { id: "budget", category: "Systems", note: "Envelopes and forecasts for money that moves.", caption: "Money, planned", number: "11" },
  { id: "fantasy-nba", category: "Play", note: "A whole NBA season, read through real box scores.", caption: "Fantasy, with data", number: "12" },
  { id: "gallery-wall", category: "Play", note: "Frame your photos and print the hang sheet before a nail goes in.", caption: "A wall, measured", number: "13" },
  { id: "zeroproof", category: "Systems", note: "Sports betting with the loss taken out.", caption: "A ledger you can't lose", number: "14" },
  { id: "calendar", category: "Interfaces", note: "Events, countdowns, and a month you can actually plan in.", caption: "Time, laid out", number: "15" },
];

/**
 * Two splits, then a wide row. Three image-beside-text rows in a row start to
 * read as a template, so every third project gets the full width instead.
 */
const LAYOUTS = ["left", "right", "wide"] as const;

/**
 * The hub entry behind a pick. Every row promises a write-up link, so a pick
 * naming no feature, or a feature with nothing written about it, is a typo.
 * Say which instead of quietly rendering a row with a missing link.
 */
function featureFor(id: string) {
  const feature = FEATURES.find((item) => item.id === id);
  if (!feature) throw new Error(`ProjectCollection picks "${id}", which isn't in FEATURES`);
  const { thoughtsHref } = feature;
  if (!thoughtsHref) throw new Error(`ProjectCollection picks "${id}", which has no write-up to link`);
  return { ...feature, thoughtsHref };
}

export default function ProjectCollection() {
  const [filter, setFilter] = useState("All");
  const projects = PICKS.filter((pick) => filter === "All" || pick.category === filter);

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
          const feature = featureFor(pick.id);
          return (
            <li key={pick.id} className={styles.showcaseRow} data-layout={LAYOUTS[index % LAYOUTS.length]}>
              {/* The screenshot opens the app too, but it's the same place as
                  the Open link, so it stays out of the tab order and the
                  accessibility tree rather than being announced twice. */}
              <Link href={feature.href} className={styles.showcaseMedia} tabIndex={-1} aria-hidden="true">
                <Image src={previewSrc(pick.id, "light")} alt="" width={1280} height={800} sizes="(max-width: 900px) 92vw, 60vw" className={styles.lightImage} />
                <Image src={previewSrc(pick.id, "dark")} alt="" width={1280} height={800} sizes="(max-width: 900px) 92vw, 60vw" className={styles.darkImage} />
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
