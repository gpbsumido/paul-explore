"use client";

import Link from "next/link";
import { HoverImageReveal } from "@paul-portfolio/react";
import { useTheme } from "@/components/ThemeProvider";
import { THOUGHTS } from "@/app/_shared/featureData.data";
import { WRITING_POOL, WRITING_SHOWN } from "../v5/featured";
import { previewSrc } from "../v5/featured";
import styles from "./playground.module.css";

// The write-ups have no captures of their own, so hovering a title reveals one
// of the app screenshots instead. Decorative, and it gives the menu a payoff.
const REVEALS = [
  "design-system",
  "operator",
  "world",
  "vitals",
  "flags",
  "work-portfolio",
];

export default function FieldNotes({ picks }: { picks?: string[] }) {
  const { theme } = useTheme();
  const chosen = picks ?? WRITING_POOL.slice(0, WRITING_SHOWN).map((p) => p.href);
  const items = chosen.flatMap((href, i) => {
    const thought = THOUGHTS.find((t) => t.href === href);
    return thought
      ? [
          {
            label: thought.title,
            image: previewSrc(REVEALS[i % REVEALS.length], theme),
            href,
          },
        ]
      : [];
  });

  return (
    <div className={styles.fieldNotes}>
      <h2>The reasoning, written while it was fresh.</h2>
      <HoverImageReveal items={items} />
      <p>
        <Link href="/thoughts">
          Every write-up on this site <span aria-hidden="true">↗</span>
        </Link>
      </p>
    </div>
  );
}
