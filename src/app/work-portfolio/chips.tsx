"use client";

import type { WorkProject, WorkFeature } from "./_data/types";

/**
 * Shared chip shell. The main body selects; the little i button opens the
 * explainer. Two separate buttons because buttons can't nest.
 */
function ChipShell({
  color,
  active,
  onClick,
  onInfo,
  onInfoHover,
  label,
  children,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
  onInfo: () => void;
  /** hover intent on the info button, true on enter and false on leave */
  onInfoHover?: (hovering: boolean) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`flex shrink-0 items-center rounded-full border bg-background text-[13px] text-foreground transition-shadow ${
        active ? "border-foreground/60 ring-2 ring-foreground/30" : "border-border"
      }`}
    >
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className="flex cursor-pointer items-center gap-2 rounded-l-full py-1.5 pl-3 pr-1.5"
      >
        <span
          aria-hidden
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        {children}
      </button>
      <button
        type="button"
        aria-label={`About ${label.replace(/^(Project|Feature): /, "")}`}
        onClick={onInfo}
        onMouseEnter={() => onInfoHover?.(true)}
        onMouseLeave={() => onInfoHover?.(false)}
        className="mr-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-[10px] font-bold text-muted hover:bg-surface hover:text-foreground"
      >
        i
      </button>
    </span>
  );
}

/** Top-ticker chip, one per past project. Clicking jumps to its first feature. */
export function ProjectChip({
  project,
  active,
  onSelect,
  onInfo,
  onInfoHover,
}: {
  project: WorkProject;
  active: boolean;
  onSelect: () => void;
  onInfo: () => void;
  onInfoHover?: (hovering: boolean) => void;
}) {
  return (
    <ChipShell
      color={project.accent.accent}
      active={active}
      onClick={onSelect}
      onInfo={onInfo}
      onInfoHover={onInfoHover}
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
  onInfo,
  onInfoHover,
}: {
  feature: WorkFeature;
  project: WorkProject;
  active: boolean;
  onSelect: () => void;
  onInfo: () => void;
  onInfoHover?: (hovering: boolean) => void;
}) {
  return (
    <ChipShell
      color={project.accent.accent}
      active={active}
      onClick={onSelect}
      onInfo={onInfo}
      onInfoHover={onInfoHover}
      label={`Feature: ${feature.title}`}
    >
      <span aria-hidden>{feature.icon}</span>
      <span className="font-medium">{feature.title}</span>
      <span className="text-[11px] text-muted">{project.name}</span>
    </ChipShell>
  );
}
