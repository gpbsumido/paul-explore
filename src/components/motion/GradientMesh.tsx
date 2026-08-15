"use client";

export type GradientMeshProps = {
  /** Mesh colours. Token vars belong here so it follows the theme. */
  colors?: string[];
  /** How long one full drift cycle takes, in milliseconds. */
  speedMs?: number;
  className?: string;
};

const DEFAULT_COLORS = [
  "var(--color-primary-400)",
  "var(--color-secondary-400)",
  "var(--color-primary-700)",
];

/**
 * A slow-drifting mesh of soft colour blooms.
 *
 * Pure CSS: three radial gradients on one element, animated by a keyframe that
 * moves their positions. No JavaScript at all, which means no hydration cost,
 * no rAF loop competing with the rest of the page, and a reduced-motion rule
 * that is simply a media query in globals.css.
 */
export default function GradientMesh({
  colors = DEFAULT_COLORS,
  speedMs = 18000,
  className,
}: GradientMeshProps) {
  const [a, b, c] = [
    colors[0] ?? DEFAULT_COLORS[0],
    colors[1] ?? colors[0] ?? DEFAULT_COLORS[1],
    colors[2] ?? colors[0] ?? DEFAULT_COLORS[2],
  ];

  return (
    <div
      aria-hidden="true"
      className={`motion-gradient-mesh pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      style={{
        ["--mesh-a" as string]: a,
        ["--mesh-b" as string]: b,
        ["--mesh-c" as string]: c,
        ["--mesh-duration" as string]: `${speedMs}ms`,
      }}
    />
  );
}
