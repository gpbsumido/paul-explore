type Props = {
  /**
   * Primary aurora colour. Defaults to verdigris. This lands inside a
   * `color-mix()`, so a CSS var is a legal value: a page that belongs to one
   * feature passes its `--color-feature-*` token and gets the dense light
   * value and the pastel dark one with no change here.
   */
  colorA?: string;
  /** Secondary aurora colour. Defaults to ember. */
  colorB?: string;
};

/**
 * The ambient backdrop that gives the landing its "alive" feel — a faint dotted
 * grid that fades toward the edges, plus two slow drifting aurora blobs. Purely
 * decorative and non-interactive.
 *
 * The drift is a CSS transform animation (see `.ambient-blob-*` in globals.css),
 * so it runs on the compositor rather than the main thread — an earlier version
 * animated it with framer-motion's JS `animate`, which sampled every frame on
 * the main thread and showed up as interaction latency (INP) on every page that
 * renders this. CSS keyframes cost nothing on the main thread, disable
 * themselves under `prefers-reduced-motion`, and let this be a plain server
 * component with no client JS at all.
 *
 * The two blob colours are parameterised so a page can tint its aurora to its
 * own accent (e.g. its feature token) while keeping the same treatment.
 */
export default function AmbientBackground({
  // Verdigris and ember rather than the violet-and-sky aurora every generated
  // landing page has. Callers still override per page.
  colorA = "#219b84",
  colorB = "#d97e1f",
}: Props) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Dotted grid, fading out toward the edges. */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, color-mix(in srgb, var(--color-foreground) 22%, transparent) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage:
            "radial-gradient(ellipse 75% 75% at 50% 45%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 75% at 50% 45%, black 40%, transparent 100%)",
        }}
      />

      <div
        className="ambient-blob ambient-blob-a absolute left-[12%] top-[15%] h-[42vmax] w-[42vmax] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${colorA} 30%, transparent), transparent 65%)`,
        }}
      />
      <div
        className="ambient-blob ambient-blob-b absolute bottom-[12%] right-[10%] h-[38vmax] w-[38vmax] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${colorB} 26%, transparent), transparent 65%)`,
        }}
      />
    </div>
  );
}
