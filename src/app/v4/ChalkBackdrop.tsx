"use client";

import { useMemo } from "react";
import { Caveat } from "next/font/google";
import { chalkLayout } from "./chalkLayout";

// A handwriting face, because the whole conceit is that someone is writing
// these. A mono or a serif traces as a machine-drawn outline, however good the
// stroke animation is.
const caveat = Caveat({ subsets: ["latin"], weight: ["500"], display: "swap" });

type ChalkTarget = { id: string; label: string; color: string };

type Props = {
  /** The apps to write, in reel order. */
  targets: readonly ChalkTarget[];
  /** Spin the machine to this app. */
  onPick: (id: string) => void;
  /** Hidden while the reels turn -- the backdrop is for the quiet moments. */
  hidden: boolean;
};

/**
 * App names writing themselves across the background in chalk, then fading out
 * again, the way ink sinks into Riddle's diary.
 *
 * The write-on is a stroke-dash trick: the glyph outlines are drawn as a dashed
 * line whose gap is the full path length, then the offset animates to zero, so
 * the letters appear to be traced. A soft fill comes in behind the stroke once
 * the tracing is done, which is what makes it read as chalk rather than as a
 * neon outline.
 *
 * Every word runs its own loop on its own delay, so at any moment some are
 * being written, some are sitting, and some are dissolving. Clicking one spins
 * the reels to that app rather than navigating -- the machine stays the way you
 * get anywhere.
 */
export default function ChalkBackdrop({ targets, onPick, hidden }: Props) {
  const words = useMemo(
    () => chalkLayout(targets.map((t) => t.label)),
    [targets],
  );

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-700 ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden={hidden}
    >
      {words.map((w, i) => {
        const target = targets[i];
        return (
          <button
            key={w.id}
            type="button"
            tabIndex={hidden ? -1 : 0}
            onClick={() => onPick(target.id)}
            aria-label={`Spin to ${w.label}`}
            className="group pointer-events-auto absolute select-none rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50"
            style={{
              left: `${w.left}%`,
              top: `${w.top}%`,
              transform: `translate(-50%, -50%) rotate(${w.rotate}deg)`,
            }}
          >
            <svg
              height={`${w.size * 2}rem`}
              width={`${w.label.length * w.size * 0.55}rem`}
              viewBox={`0 0 ${w.label.length * 55} 110`}
              className="overflow-visible"
            >
              <text
                x="0"
                y="78"
                className={caveat.className}
                style={{
                  fontSize: 74,
                  letterSpacing: "0.01em",
                  fill: "none",
                  stroke: target.color,
                  strokeWidth: 1.1,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeDasharray: w.dash,
                  strokeDashoffset: w.dash,
                  // The dash length is per word, so the trace has to be too.
                  ["--v4-dash" as string]: `${w.dash}`,
                  animation: `v4-chalk-write ${w.duration}ms ${w.delay}ms linear infinite`,
                  opacity: 0.55,
                }}
              >
                {w.label}
              </text>
              {/* The soft body of the chalk, arriving behind the traced line. */}
              <text
                x="0"
                y="78"
                className={caveat.className}
                style={{
                  fontSize: 74,
                  letterSpacing: "0.01em",
                  fill: target.color,
                  opacity: 0,
                  animation: `v4-chalk-fill ${w.duration}ms ${w.delay}ms ease-in-out infinite`,
                }}
              >
                {w.label}
              </text>
            </svg>
          </button>
        );
      })}
    </div>
  );
}
