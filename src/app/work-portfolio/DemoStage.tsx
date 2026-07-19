"use client";

import type { CSSProperties } from "react";
import type { WorkFeature, WorkProject } from "./_data/types";
import { demoFor } from "./demos/registry";

/**
 * The themed surface a demo renders on. Page chrome stays in the site's
 * design system; in here each project's accent color, surface tint, and
 * typography flavor take over, which is the hybrid look.
 */
export default function DemoStage({
  feature,
  project,
}: {
  feature: WorkFeature;
  project: WorkProject;
}) {
  const Demo = demoFor(feature);
  const style: CSSProperties & { "--wp-accent": string } = {
    backgroundColor: project.accent.surface,
    "--wp-accent": project.accent.accent,
  };

  return (
    <div
      data-testid="demo-stage"
      className={`h-full overflow-y-auto rounded-xl border border-border ${
        project.accent.font === "mono" ? "font-mono" : ""
      }`}
      style={style}
    >
      <Demo feature={feature} />
    </div>
  );
}
