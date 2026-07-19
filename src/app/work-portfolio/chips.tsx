"use client";

import type { WorkProject, WorkFeature } from "./_data/types";

/** Shared chip shell so project and feature chips stay visually consistent. */
function ChipShell({
  color,
  active,
  onClick,
  label,
  children,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-[13px] text-foreground transition-shadow ${
        active ? "border-foreground/60 ring-2 ring-foreground/30" : "border-border"
      }`}
    >
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {children}
    </button>
  );
}

/** Top-ticker chip, one per past project. Clicking jumps to its first feature. */
export function ProjectChip({
  project,
  active,
  onSelect,
}: {
  project: WorkProject;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <ChipShell
      color={project.accent.accent}
      active={active}
      onClick={onSelect}
      label={`Project: ${project.name}`}
    >
      <span className="font-medium">{project.name}</span>
    </ChipShell>
  );
}

/** Bottom-ticker chip, one per demoable feature. Dot inherits the project accent. */
export function FeatureChip({
  feature,
  project,
  active,
  onSelect,
}: {
  feature: WorkFeature;
  project: WorkProject;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <ChipShell
      color={project.accent.accent}
      active={active}
      onClick={onSelect}
      label={`Feature: ${feature.title}`}
    >
      <span aria-hidden>{feature.icon}</span>
      <span className="font-medium">{feature.title}</span>
      <span className="text-[11px] text-muted">{project.name}</span>
    </ChipShell>
  );
}
