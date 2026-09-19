"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { RubberSegment, Spotlight, TiltCard, ClickSpark, Button } from "@paul-portfolio/react";
import { FEATURES } from "@/app/_shared/featureData.data";
import styles from "./surprise.module.css";

type Feature = (typeof FEATURES)[number];

const VIEWS = ["Spin", "List"];

const isExternal = (href: string) => /^https?:\/\//.test(href);

/** A feature card links out with a real anchor for external targets and a
 * client-routed Link for internal ones. */
function FeatureLink({
  feature,
  className,
  children,
}: {
  feature: Feature;
  className?: string;
  children: ReactNode;
}) {
  if (isExternal(feature.href)) {
    return (
      <a
        href={feature.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={feature.href} className={className}>
      {children}
    </Link>
  );
}

export default function SurpriseContent() {
  const [view, setView] = useState("Spin");
  const [picked, setPicked] = useState(0);
  const feature = FEATURES[picked];

  // Random pick lives in the click handler, never in render, so it stays out of
  // hydration and the purity lint.
  const roll = () => {
    if (FEATURES.length < 2) return;
    let next = picked;
    while (next === picked) next = Math.floor(Math.random() * FEATURES.length);
    setPicked(next);
  };

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Surprise</p>
        <h1 className={styles.title}>
          Every corner of the site<span className={styles.accent}>.</span>
        </h1>
        <p className={styles.lede}>
          Spin for somewhere to land, or browse the whole set. All{" "}
          {FEATURES.length} of them, including the ones the discover reel leaves
          out.
        </p>
        <div className={styles.toggle}>
          <fieldset className={styles.fieldset}>
            <legend className="sr-only">Choose a view</legend>
            <RubberSegment segments={VIEWS} value={view} onChange={setView} />
          </fieldset>
        </div>
      </header>

      {view === "Spin" ? (
        <section className={styles.spin} aria-label="Spin for a feature">
          <TiltCard maxTilt={5} glare={false} className={styles.spinTilt}>
            <Spotlight
              color={`color-mix(in srgb, ${feature.color} 24%, transparent)`}
              className={styles.spinCard}
            >
              <span
                className={styles.dot}
                style={{ background: feature.color }}
                aria-hidden="true"
              />
              <h2 className={styles.spinTitle}>{feature.title}</h2>
              <p className={styles.spinNote}>{feature.description}</p>
              <div className={styles.spinActions}>
                <FeatureLink feature={feature} className={styles.take}>
                  Take me there <span aria-hidden="true">→</span>
                </FeatureLink>
                {feature.thoughtsHref ? (
                  <Link href={feature.thoughtsHref} className={styles.read}>
                    Read the write-up
                  </Link>
                ) : null}
              </div>
            </Spotlight>
          </TiltCard>
          <ClickSpark>
            <Button onClick={roll} variant="primary">
              Surprise me <span aria-hidden="true">↻</span>
            </Button>
          </ClickSpark>
        </section>
      ) : (
        <ul className={styles.grid} aria-label="All features">
          {FEATURES.map((f) => (
            <li key={f.id} className={styles.cell}>
              <Spotlight
                color={`color-mix(in srgb, ${f.color} 20%, transparent)`}
                className={styles.cardSurface}
              >
                <FeatureLink feature={f} className={styles.card}>
                  <span
                    className={styles.cardBar}
                    style={{ background: f.color }}
                    aria-hidden="true"
                  />
                  <span className={styles.cardTitle}>
                    {f.title}
                    {isExternal(f.href) ? (
                      <span aria-hidden="true"> ↗</span>
                    ) : null}
                  </span>
                  <span className={styles.cardNote}>{f.description}</span>
                </FeatureLink>
              </Spotlight>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
