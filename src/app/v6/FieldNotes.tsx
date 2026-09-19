"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BotanicalText, DriftWall } from "@paul-portfolio/react";
import { useTheme } from "@/components/ThemeProvider";
import { THOUGHTS } from "@/app/_shared/featureData.data";
import { WRITING_POOL, WRITING_SHOWN } from "../v5/featured";
import { previewSrc } from "../v5/featured";
import styles from "./playground.module.css";

// The write-ups have no captures of their own, so the wall behind the bloom uses
// the app screenshots as tiles that link out to the docs and write-ups.
const TILE_IMAGES = [
  "design-system",
  "operator",
  "world",
  "vitals",
  "flags",
  "work-portfolio",
];

const BLOOM_TEXT = "docs and thoughts";

export default function FieldNotes({ picks }: { picks?: string[] }) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(96);

  // The bloom text is drawn at a fixed pixel size, so on a narrow stage it
  // overflows instead of staying centered. Scale the size to the stage width so
  // the whole phrase always fits, and re-measure on resize.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const width = stage.clientWidth;
      const fitted = Math.round((width * 1.5) / BLOOM_TEXT.length);
      setFontSize(Math.max(30, Math.min(120, fitted)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);
  const chosen = picks ?? WRITING_POOL.slice(0, WRITING_SHOWN).map((p) => p.href);
  const tiles = chosen.flatMap((href, i) => {
    const thought = THOUGHTS.find((t) => t.href === href);
    return thought
      ? [
          {
            image: previewSrc(TILE_IMAGES[i % TILE_IMAGES.length], theme),
            title: thought.title,
            href,
          },
        ]
      : [];
  });

  return (
    <div className={styles.fieldNotes}>
      <div
        ref={stageRef}
        className={styles.fieldNotesStage}
        onPointerOver={(event) => {
          const link = (event.target as HTMLElement).closest("a");
          const image = link?.querySelector("img");
          setHovered(image?.getAttribute("alt") || null);
        }}
        onPointerLeave={() => setHovered(null)}
      >
        <DriftWall
          items={[...tiles, ...tiles]}
          columns={4}
          className={styles.driftWall}
        />
        <div className={styles.bloom} aria-hidden="true">
          <BotanicalText
            text={BLOOM_TEXT}
            fontSize={fontSize}
            className={styles.bloomText}
          />
        </div>
        <span className={styles.hoverTitle} data-show={hovered ? "true" : "false"} aria-hidden="true">
          {hovered}
        </span>
      </div>
      <p className={styles.fieldNotesLink}>
        <Link href="/thoughts">
          Every write-up on this site <span aria-hidden="true">↗</span>
        </Link>
      </p>
    </div>
  );
}
