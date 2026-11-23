type Props = {
  /**
   * Primary tint, faint, from the top left. Defaults to verdigris. This lands
   * inside a `color-mix()`, so a CSS var is a legal value: a page that belongs
   * to one feature passes its `--color-feature-*` token and gets the dense
   * light value and the pastel dark one with no change here.
   */
  colorA?: string;
  /** Secondary tint, from the bottom right. Defaults to cyan. */
  colorB?: string;
};

/**
 * The backdrop behind every page: a fine line grid with a coarser one over it,
 * drifting slowly on a diagonal and fading into the page colour toward the
 * edges, so the content sits on graph paper rather than a flat fill. Fixed to
 * the viewport, so the drift reads the same at any scroll depth.
 *
 * The grid and its drift live in globals.css (`.grid-backdrop`). The drift is a
 * compositor transform gated on prefers-reduced-motion: no-preference, so this
 * stays a server component with no client JS.
 *
 * The two tints are what's left of the old aurora blobs: static, and faint
 * enough that a feature's accent shows without competing with the grid.
 */
export default function AmbientBackground({
  colorA = "var(--color-primary-500)",
  colorB = "var(--paul-color-cyan-500)",
}: Props) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 15% 10%, color-mix(in srgb, ${colorA} 9%, transparent), transparent 70%), radial-gradient(ellipse 55% 45% at 90% 95%, color-mix(in srgb, ${colorB} 7%, transparent), transparent 70%)`,
        }}
      />
      <div className="grid-backdrop absolute inset-0" />
    </div>
  );
}
