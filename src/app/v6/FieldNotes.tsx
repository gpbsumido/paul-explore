"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BotanicalText, DriftWall } from "@paul-portfolio/react";
import { useTheme } from "@/components/ThemeProvider";
import { THOUGHTS } from "@/app/_shared/featureData.data";
import { WRITING_POOL } from "../v5/featured";
import { previewSrc } from "../v5/featured";
import styles from "./playground.module.css";

// The write-ups have no captures of their own, so the wall behind the bloom uses
// the app screenshots as tiles that link out to the docs and write-ups. One
// screenshot per tile, all distinct, so nothing repeats on the wall.
const TILE_IMAGES = [
  "design-system",
  "operator",
  "world",
  "vitals",
  "flags",
  "work-portfolio",
  "pokemon",
  "particles",
];

const BLOOM_TEXT = "docs and thoughts";

export default function FieldNotes({ picks }: { picks?: string[] }) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(120);

  // The bloom is drawn at a fixed pixel size, so scale it to the stage width so
  // the whole phrase fits and the letters stay big enough to read the flowers.
  // Re-measure on resize.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const width = stage.clientWidth;
      // Tuned so a ~13in laptop lands a little under the design-system default
      // of 120, scaling down on smaller stages and up to a cap on larger ones.
      const fitted = Math.round((width * 1.45) / BLOOM_TEXT.length);
      setFontSize(Math.max(40, Math.min(140, fitted)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // Fill the wall with distinct write-ups: whatever was picked first, then the
  // rest of the pool, deduped, capped at one per screenshot so every tile is a
  // unique link and a unique image.
  const hrefs = Array.from(
    new Set([...(picks ?? []), ...WRITING_POOL.map((p) => p.href)]),
  ).slice(0, TILE_IMAGES.length);
  const tiles = hrefs.flatMap((href, i) => {
    const thought = THOUGHTS.find((t) => t.href === href);
    return thought
      ? [{ image: previewSrc(TILE_IMAGES[i], theme), title: thought.title, href }]
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
        <DriftWall items={tiles} columns={4} className={styles.driftWall} />
        <div
          className={styles.bloom}
          data-hovered={hovered ? "true" : "false"}
          aria-hidden="true"
        >
          <BotanicalText
            text={BLOOM_TEXT}
            fontSize={fontSize}
            density={19}
            className={styles.bloomText}
          />
          {/* Below the wall's small breakpoint the flowers shrink to noise, so
              swap in plain lettering in the same rose. Both fade when a tile is
              hovered so the image underneath reads. */}
          <span className={styles.bloomTitle}>{BLOOM_TEXT}</span>
        </div>
        <span
          className={styles.hoverTitle}
          data-show={hovered ? "true" : "false"}
          aria-hidden="true"
        >
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
