"use client";

import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import type { WorkProject, WorkFeature } from "./_data/types";

/**
 * Shared chip shell. The main body (a ghost Button) selects; a small
 * IconButton opens the explainer. Both come from the app design system.
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
  onInfoHover?: (hovering: boolean) => void;
  label: string;
  children: React.ReactNode;
}) {
  const name = label.replace(/^(Project|Feature): /, "");
  return (
    <span
      className={`flex shrink-0 items-center rounded-full border bg-background text-[13px] transition-shadow ${
        active ? "border-foreground/60 ring-2 ring-foreground/30" : "border-border"
      }`}
    >
      <Button
        variant="ghost"
        size="sm"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className="!rounded-l-full !rounded-r-none !px-3 !py-1"
      >
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        {children}
      </Button>
      <IconButton
        size="sm"
        aria-label={`About ${name}`}
        onClick={onInfo}
        onMouseEnter={() => onInfoHover?.(true)}
        onMouseLeave={() => onInfoHover?.(false)}
        className="mr-1 !h-5 !w-5 text-[10px] font-bold"
      >
        i
      </IconButton>
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
      <span className="font-medium text-foreground">{project.name}</span>
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
      <span className="font-medium text-foreground">{feature.title}</span>
      <span className="text-[11px] text-muted">{project.name}</span>
    </ChipShell>
  );
}
