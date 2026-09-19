"use client";

import { useEffect, useRef, useState } from "react";
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
  { id: "pokemon", category: "Play", note: "Three little apps sharing one Pokémon dataset.", caption: "Data, three ways", number: "07" },
  { id: "particles", category: "Play", note: "A constellation that leans toward your cursor.", caption: "A physics toy", number: "08" },
];

export default function ProjectCollection() {
  const [filter, setFilter] = useState("All");
  const projects = PICKS.filter((pick) => filter === "All" || pick.category === filter);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  // Vertical scroll through the (tall) section drives the track sideways: as you
  // scroll down, the projects pass by left to right. The section height is set
  // to the track's overflow so the two distances match. Under reduced motion we
  // bail out and let the row scroll normally, so no one gets scroll-jacked.
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const update = () => {
      // Reduced motion or a narrow screen: hand back to a normal wrapping row
      // (the CSS unpins it), so we never scroll-jack where it'd hurt.
      const off =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
        window.innerWidth < 768;
      if (off) {
        track.style.transform = "";
        return;
      }
      // The section height is a fixed CSS value, so filtering never resizes it
      // (which was jumping the page). We just map that fixed scroll distance to
      // the track's current overflow.
      const scrollable = section.offsetHeight - window.innerHeight;
      const progress = scrollable > 0
        ? Math.min(1, Math.max(0, -section.getBoundingClientRect().top / scrollable))
        : 0;
      const distance = Math.max(0, track.scrollWidth - track.clientWidth);
      track.style.transform = `translate3d(${-progress * distance}px, 0, 0)`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [projects.length]);

  return (
    <>
    <section id="work" ref={sectionRef} className={styles.workScroll} aria-labelledby="work-title">
      <div className={styles.workSticky}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>02 / Open for exploring</p><h2 id="work-title">Pick a rabbit hole<span className={styles.accent}>.</span></h2></div>
          <p>Working apps. Small obsessions.<br />Scroll to travel through them.</p>
        </div>
        <div className={styles.filterBar}>
          <fieldset><legend className="sr-only">Filter projects</legend><RubberSegment segments={FILTERS} value={filter} onChange={setFilter} /></fieldset>
          <span aria-live="polite" aria-atomic="true" className={styles.count}>{String(projects.length).padStart(2, "0")} projects / {filter}</span>
        </div>
        <ul ref={trackRef} className={styles.projectsRow} aria-label="Projects">
          {projects.map((pick) => {
            const feature = FEATURES.find((item) => item.id === pick.id)!;
            return (
              <li key={pick.id} className={styles.project}>
                <TiltCard maxTilt={4} glare={false} className={styles.tilt}>
                  <Spotlight color="color-mix(in srgb, var(--paul-color-primary-400) 15%, transparent)" className={styles.projectSurface}>
                    <Link href={feature.href} className={styles.projectLink}>
                      <div className={styles.projectTop}><span>{pick.number} / {pick.caption}</span><span className={styles.openArrow} aria-hidden="true">↗</span></div>
                      <div className={styles.preview}>
                        <Image src={previewSrc(pick.id, "light")} alt="" width={1280} height={800} sizes="(max-width: 700px) 90vw, 30vw" className={styles.lightImage} />
                        <Image src={previewSrc(pick.id, "dark")} alt="" width={1280} height={800} sizes="(max-width: 700px) 90vw, 30vw" className={styles.darkImage} />
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
      </div>
    </section>
    <div className={styles.collectionFooter}><p>This is just the shortlist. There are {FEATURES.length} places to go.</p><ClickSpark><Button href="/discover" variant="outline">Surprise me <span aria-hidden="true">↗</span></Button></ClickSpark><Button href="/design-system" variant="ghost">Explore the components <span aria-hidden="true">↗</span></Button></div>
    </>
  );
}
