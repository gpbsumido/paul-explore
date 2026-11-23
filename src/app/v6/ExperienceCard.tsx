"use client";

import { useState } from "react";
import { RubberSegment, Timeline } from "@paul-portfolio/react";
import { EDUCATION, WORK } from "./experience";
import styles from "./playground.module.css";

const VIEWS = {
  Work: { label: "Work history", entries: WORK },
  Education: { label: "Education", entries: EDUCATION },
};
type View = keyof typeof VIEWS;
const isView = (value: string): value is View => value in VIEWS;

/**
 * Work and education in one card, with a switch between them, after the
 * reference site's tabbed experience card. It uses the design system's
 * Timeline, which is an ordered list with a <time> per entry, so the order is
 * real to a screen reader and not just a line down the side.
 */
export default function ExperienceCard() {
  const [view, setView] = useState<View>("Work");
  const { label, entries } = VIEWS[view];

  return (
    <div className={styles.experience}>
      <fieldset className={styles.experienceSwitch}>
        <legend className="sr-only">Show</legend>
        <RubberSegment segments={Object.keys(VIEWS)} value={view} onChange={(next) => isView(next) && setView(next)} />
      </fieldset>
      <Timeline
        label={label}
        className={styles.experienceTimeline}
        items={entries.map((entry) => ({
          id: entry.id,
          time: entry.dates,
          title: (
            <>
              <span className={styles.experienceRole}>{entry.title}</span>
              <span className={styles.experiencePlace}>{entry.place}</span>
            </>
          ),
          description: entry.points.length > 0 && (
            <ul className={styles.experiencePoints}>
              {entry.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          ),
        }))}
      />
    </div>
  );
}
