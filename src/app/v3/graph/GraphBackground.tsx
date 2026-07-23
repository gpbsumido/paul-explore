"use client";

import { m, useReducedMotion } from "framer-motion";

/**
 * Ambient backdrop for the graph: a faint dotted grid plus two slow drifting
 * aurora blobs. Purely decorative and non-interactive; drift is disabled for
 * reduced-motion visitors.
 */
export default function GraphBackground() {
  const reduced = useReducedMotion() ?? false;

  const drift = (dx: number, dy: number) =>
    reduced
      ? undefined
      : {
          x: [0, dx, 0],
          y: [0, dy, 0],
        };

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
          background:
            "radial-gradient(circle, color-mix(in srgb, #8b5cf6 30%, transparent), transparent 65%)",
        }}
        animate={drift(80, 60)}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <m.div
        className="absolute right-[10%] bottom-[12%] h-[38vmax] w-[38vmax] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, #38bdf8 26%, transparent), transparent 65%)",
        }}
        animate={drift(-70, -50)}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
