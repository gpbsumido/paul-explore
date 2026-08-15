"use client";

import { useMemo } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CONFETTI_COUNT, confettiPieces } from "./winPieces";
import { ACCENT_BAND } from "@/lib/accentBand";

/**
 * How long the celebration stays mounted.
 *
 * Must outlast the slowest piece or the layer unmounts mid-fall and the
 * confetti simply vanishes: the longest stagger (~1.1s) plus the longest fall
 * (~4.8s), with a beat spare.
 */
export const WIN_MS = 6200;

/**
 * A real party palette. The landed option's colour leads so the celebration
 * still belongs to the thing you won, but confetti that is only two colours
 * reads as a loading state, not a party.
 */
const PARTY = [
  ACCENT_BAND.coral,
  ACCENT_BAND.gold,
  ACCENT_BAND.sea,
  ACCENT_BAND.azure,
  ACCENT_BAND.violet,
  ACCENT_BAND.magenta,
  ACCENT_BAND.ember,
  ACCENT_BAND.verdigris,
] as const;

/** How the whole burst falls. Chosen per win, so wins don't all look alike. */
export type FallStyle = 1 | 2 | 3 | 4;

type Props = {
  /** The landed option's colour, so the celebration matches what you won. */
  optionColor: string;
  /** The category accent, as the second note in the palette. */
  accent: string;
  /** Which fall style this win uses. */
  style: FallStyle;
};

/**
 * A fall of party confetti across the window on a win.
 *
 * Foil rectangles, each tumbling on its own axis at its own speed and drifting
 * sideways as it falls -- the tumble is what sells it, since a piece turning
 * edge-on briefly disappears. The landed option's colour leads the palette so
 * the celebration still belongs to the thing you won.
 *
 * Entirely decorative: `aria-hidden` and pointer-transparent, and the caller
 * does not render it at all under reduced motion.
 */
export default function WinCelebration({ optionColor, accent, style }: Props) {
  // No confetti on a phone. Thinning the count and dropping the sheen still
  // stuttered on real hardware: dozens of tumbling, semi-transparent layers is
  // a fill-rate cost a phone GPU can't carry, and an emulator on a laptop's GPU
  // never shows it. The win still reads on mobile through the reels landing, the
  // result bar, and the sound, so the decoration is the thing that gives.
  // Safe against hydration since the layer only ever mounts client-side, on a
  // win, well after the first pass.
  const isMobile = useIsMobile();
  // Deterministic, so the burst is identical on the server and the first client
  // pass. Memoised per palette so a re-render mid-flourish doesn't restart it.
  const palette = useMemo(
    () => [optionColor, accent, ...PARTY],
    [optionColor, accent],
  );
  const confetti = useMemo(
    () => confettiPieces(CONFETTI_COUNT, palette),
    [palette],
  );

  if (isMobile) return null;

  return (
    <div
      aria-hidden
      data-testid="win-celebration"
      // Fixed, so it falls across the whole window rather than just the
      // machine -- but behind the reels and the loupe, which stay readable.
      // The shine lives on the loupe itself, not in here.
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {confetti.map((c) => (
        <div
          key={c.id}
          className="absolute"
          style={
            {
              left: `${c.left}%`,
              top: -24,
              width: c.width,
              height: c.height,
              backgroundColor: c.color,
              // A touch of sheen so each piece reads as foil rather than paper.
              backgroundImage:
                "linear-gradient(120deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 55%)",
              // Promote every piece to its own layer upfront. Without this the
              // browser promotes them all at burst start, and that allocation
              // hitch is a jump on the first frame.
              willChange: "transform",
              backfaceVisibility: "hidden",
              "--v4-drift": `${c.drift}px`,
              "--v4-spin": `${c.spin}deg`,
              "--v4-flip": `${c.flip}deg`,
              animation: `v4-win-confetti-${style} ${c.duration}ms ${c.delay}ms linear forwards`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
