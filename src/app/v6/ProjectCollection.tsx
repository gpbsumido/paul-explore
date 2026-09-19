"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, ClickSpark, RubberSegment, Spotlight, TiltCard } from "@paul-portfolio/react";
import { FEATURES } from "@/app/_shared/featureData.data";
import { previewSrc } from "../v5/featured";
import styles from "./playground.module.css";

const FILTERS = ["All", "Interfaces", "Systems", "Play"];
const PICKS = [
  { id: "work-portfolio", category: "Interfaces", note: "From shipped product to hands-on demo.", caption: "Product work", number: "01" },
  { id: "design-system", category: "Systems", note: "The building blocks behind everything here.", caption: "Design × engineering", number: "02" },
  { id: "world", category: "Play", note: "Take the scenic route through a tiny Toronto.", caption: "An explorable world", number: "03" },
  { id: "operator", category: "Interfaces", note: "A retail fleet, with every detail one click away.", caption: "Tools for real decisions", number: "04" },
  { id: "flags", category: "Systems", note: "Ship it. Roll it out. Keep a way back.", caption: "Release control", number: "05" },
  { id: "vitals", category: "Systems", note: "This site’s performance, measured in the wild.", caption: "The reality check", number: "06" },
];

export default function ProjectCollection() {
  const [filter, setFilter] = useState("All");
  const projects = PICKS.filter((pick) => filter === "All" || pick.category === filter);

  return (
    <section id="work" className={styles.work} aria-labelledby="work-title">
      <div className={styles.sectionHeading}>
        <div><p className={styles.eyebrow}>02 / Open for exploring</p><h2 id="work-title">Pick a rabbit hole<span className={styles.accent}>.</span></h2></div>
        <p>Working apps. Small obsessions.<br />There’s something to play with in every one.</p>
      </div>
      <div className={styles.filterBar}>
        <fieldset><legend className="sr-only">Filter projects</legend><RubberSegment segments={FILTERS} value={filter} onChange={setFilter} /></fieldset>
        <span aria-live="polite" aria-atomic="true" className={styles.count}>{String(projects.length).padStart(2, "0")} projects / {filter}</span>
      </div>
      <ul className={styles.projects} aria-label="Projects">
        {projects.map((pick) => {
          const feature = FEATURES.find((item) => item.id === pick.id)!;
          return (
            <li key={pick.id} className={styles.project}>
              <TiltCard maxTilt={4} glare={false} className={styles.tilt}>
                <Spotlight color="color-mix(in srgb, var(--paul-color-primary-400) 15%, transparent)" className={styles.projectSurface}>
                  <Link href={feature.href} className={styles.projectLink}>
                    <div className={styles.projectTop}><span>{pick.number} / {pick.caption}</span><span className={styles.openArrow} aria-hidden="true">↗</span></div>
                    <div className={styles.preview}>
                      <Image src={previewSrc(pick.id, "light")} alt="" width={1280} height={800} sizes="(max-width: 700px) 90vw, 55vw" className={styles.lightImage} />
                      <Image src={previewSrc(pick.id, "dark")} alt="" width={1280} height={800} sizes="(max-width: 700px) 90vw, 55vw" className={styles.darkImage} />
                      <span className={styles.openLabel} aria-hidden="true">Step inside ↗</span>
                    </div>
                    <div className={styles.projectTitle}><h3>{feature.title}</h3><span>{pick.category}</span></div>
                    <p className={styles.projectNote}>{pick.note}</p>
                  </Link>
                </Spotlight>
              </TiltCard>
            </li>
          );
        })}
      </ul>
      <div className={styles.collectionFooter}><p>This is just the shortlist. There are {FEATURES.length} places to go.</p><ClickSpark><Button href="/discover" variant="outline">Surprise me <span aria-hidden="true">↗</span></Button></ClickSpark><Button href="/design-system" variant="ghost">Explore the components <span aria-hidden="true">↗</span></Button></div>
    </section>
  );
}
