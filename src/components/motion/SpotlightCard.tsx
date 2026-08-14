"use client";

import type { ReactNode } from "react";
import { Spotlight } from "@paul-portfolio/react";

export type SpotlightCardProps = {
  children: ReactNode;
  /** Any CSS colour. Feature accent tokens are the intended input. */
  accent?: string;
  /** Diameter of the glow, in pixels. */
  size?: number;
  className?: string;
};

/**
 * A glass card with a glow that follows the cursor across it.
 *
 * The tracking is the design system's own Spotlight, which has shipped in
 * @paul-portfolio/react for a while without a single page rendering it. This
 * wrapper is only the glass surface and the accent wiring, so the reduced-motion
 * behaviour stays where the package already handles it: the glow pins to the
 * centre and stops chasing the pointer.
 */
export default function SpotlightCard({
  children,
  accent,
  size = 340,
  className,
}: SpotlightCardProps) {
  return (
    <Spotlight
      size={size}
      color={accent}
      className={`glass-card rounded-2xl ${className ?? ""}`}
      style={accent ? { ["--glass-accent" as string]: accent } : undefined}
    >
      {children}
    </Spotlight>
  );
}
