"use client";

import type { CSSProperties } from "react";
import type { AccentTheme, WorkFeature, WorkProject } from "./_data/types";
import { DEMO_BY_SLUG } from "./demos/registry";
import ComingSoonDemo from "./demos/ComingSoonDemo";

/**
 * Build the stage's background from the project's own accent so every project
 * reads as a different surface, not the same near-black with a faint tint.
 *
 * Two layers do the work: an accent corner glow that colours the whole stage,
 * and a texture keyed to the project's typography flavour -- graph-paper grid
 * for the mono/data projects, a dot field for the sans ones. Both are the
 * accent colour at low alpha (hex is always 6 digits here, so appending two
 * hex digits sets opacity), so switching projects visibly re-skins the stage.
 */
function stageBackground(accent: AccentTheme): CSSProperties {
  const a = accent.accent;
  const glow = `radial-gradient(90% 65% at 6% -8%, ${a}24, transparent 60%)`;
  const [images, sizes] =
    accent.font === "mono"
      ? [
          [
            glow,
            `linear-gradient(${a}10 1px, transparent 1px)`,
            `linear-gradient(90deg, ${a}10 1px, transparent 1px)`,
          ],
          ["cover", "26px 26px", "26px 26px"],
        ]
      : [
          [glow, `radial-gradient(${a}18 1px, transparent 1.5px)`],
          ["cover", "18px 18px"],
        ];
  return {
    backgroundColor: accent.surface,
    backgroundImage: images.join(", "),
    backgroundSize: sizes.join(", "),
  };
}

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
  // plain lookup into the module-level map, component identities are stable
  const Demo = DEMO_BY_SLUG[feature.slug] ?? ComingSoonDemo;
  const style: CSSProperties & { "--wp-accent": string } = {
    ...stageBackground(project.accent),
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
