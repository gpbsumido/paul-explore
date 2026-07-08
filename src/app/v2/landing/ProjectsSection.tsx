"use client";

import { FEATURES, PREVIEW_MAP } from "@/app/_shared/featureData";
import ProjectCard from "./ProjectCard";

const GROUPS = [
  {
    label: "Fantasy & NBA",
    ids: ["nba", "matchups", "court-vision", "league", "playoffs"],
  },
  { label: "Pok\u00e9mon", ids: ["tcg", "pocket", "graphql"] },
  { label: "Productivity", ids: ["calendar"] },
  { label: "Engineering", ids: ["vitals", "operator"] },
  { label: "Labs & Learning", ids: ["particles", "learn"] },
  { label: "Social", ids: ["ketsup"] },
];

const featureById = new Map(FEATURES.map((f) => [f.id, f]));

export default function ProjectsSection() {
  return (
    <section id="projects" className="mx-auto max-w-6xl px-6 py-24">
      {GROUPS.map((group, gi) => (
        <div key={group.label} className={gi > 0 ? "mt-16 sm:mt-24" : ""}>
          {/* Sticky category label + thin rule */}
          <div className="sticky top-16 z-10 space-y-2 bg-background/80 pb-4 pt-2 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">
              {group.label}
            </p>
            <hr className="border-border" />
          </div>

          {/* Cards — alternating reversed for zig-zag */}
          <div className="space-y-16 sm:space-y-24">
            {group.ids.map((id, i) => {
              const feature = featureById.get(id);
              if (!feature) return null;
              const Preview = PREVIEW_MAP[id];
              return (
                <ProjectCard
                  key={id}
                  title={feature.title}
                  description={feature.description}
                  href={feature.href}
                  color={feature.color}
                  preview={Preview ? <Preview /> : null}
                  thoughtsHref={feature.thoughtsHref}
                  index={i}
                  reversed={i % 2 === 1}
                />
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
