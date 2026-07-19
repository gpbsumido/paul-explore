"use client";

import { useState } from "react";
import { PROJECTS, FEATURES, projectFor } from "./_data/catalog";
import IntroCard from "./IntroCard";
import Ticker from "./Ticker";
import { ProjectChip, FeatureChip } from "./chips";

/**
 * Client shell for the work-portfolio page. Owns the single piece of state,
 * the selected feature index (null means the intro card is showing).
 */
export default function WorkPortfolioContent() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selected = selectedIndex === null ? null : FEATURES[selectedIndex];
  const selectedProjectId = selected ? selected.projectId : null;

  /** Jump to a project's first feature, used by the top ticker. */
  const selectProject = (projectId: string) => {
    const first = FEATURES.findIndex((f) => f.projectId === projectId);
    if (first !== -1) setSelectedIndex(first);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Ticker label="Projects ticker" edge="top" direction="left">
        {PROJECTS.map((project) => (
          <ProjectChip
            key={project.id}
            project={project}
            active={project.id === selectedProjectId}
            onSelect={() => selectProject(project.id)}
          />
        ))}
      </Ticker>
      <main className="flex flex-1 items-stretch px-4 py-6" aria-label="Demo stage">
        <div className="mx-auto w-full max-w-4xl">
          {selected === null ? (
            <IntroCard />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                {projectFor(selected).name}
              </p>
              <h1 className="text-2xl font-bold text-foreground">
                {selected.title}
              </h1>
              <p className="text-[15px] text-muted">{selected.tagline}</p>
            </div>
          )}
        </div>
      </main>
      <Ticker label="Features ticker" edge="bottom" direction="right">
        {FEATURES.map((feature, i) => (
          <FeatureChip
            key={feature.slug}
            feature={feature}
            project={projectFor(feature)}
            active={i === selectedIndex}
            onSelect={() => setSelectedIndex(i)}
          />
        ))}
      </Ticker>
    </div>
  );
}
