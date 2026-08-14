"use client";

import { m, useReducedMotion } from "framer-motion";

type Props = {
  /** Primary aurora colour. Defaults to the landing page's violet. */
  colorA?: string;
  /** Secondary aurora colour. Defaults to the landing page's sky blue. */
  colorB?: string;
};

/**
 * The ambient backdrop that gives the v3 landing its "alive" feel — a faint
 * dotted grid that fades toward the edges, plus two slow drifting aurora blobs.
 * Purely decorative and non-interactive; drift is disabled for reduced-motion
 * visitors. Drop it as the first child of a `relative` container and render the
 * page content above it.
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
  const reduced = useReducedMotion() ?? false;

  const drift = (dx: number, dy: number) =>
    reduced ? undefined : { x: [0, dx, 0], y: [0, dy, 0] };

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

      <m.div
        className="absolute left-[12%] top-[15%] h-[42vmax] w-[42vmax] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${colorA} 30%, transparent), transparent 65%)`,
        }}
        animate={drift(80, 60)}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <m.div
        className="absolute bottom-[12%] right-[10%] h-[38vmax] w-[38vmax] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${colorB} 26%, transparent), transparent 65%)`,
        }}
        animate={drift(-70, -50)}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
