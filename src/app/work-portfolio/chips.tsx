"use client";

import type { WorkProject, WorkFeature } from "./_data/types";

/** Shared chip shell so project and feature chips stay visually consistent. */
function ChipShell({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[13px] text-foreground">
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {children}
    </span>
  );
}

/** Top-ticker chip, one per past project. */
export function ProjectChip({ project }: { project: WorkProject }) {
  return (
    <ChipShell color={project.accent.accent}>
      <span className="font-medium">{project.name}</span>
    </ChipShell>
  );
}

/** Bottom-ticker chip, one per demoable feature. Dot inherits the project accent. */
export function FeatureChip({
  feature,
  project,
}: {
  feature: WorkFeature;
  project: WorkProject;
}) {
  return (
    <ChipShell color={project.accent.accent}>
      <span aria-hidden>{feature.icon}</span>
      <span className="font-medium">{feature.title}</span>
      <span className="text-[11px] text-muted">{project.name}</span>
    </ChipShell>
  );
}
