"use client";

import { useEffect, useRef, useState } from "react";
import { Caveat } from "next/font/google";
import { placeChalkWord, pickUnused, type ChalkPlacement } from "./chalkLayout";

// A handwriting face, because the whole conceit is that someone is writing
// these. A mono or a serif traces as a machine-drawn outline, however good the
// stroke animation is.
const caveat = Caveat({ subsets: ["latin"], weight: ["500"], display: "swap" });

/** Most words on screen at once. Enough to feel alive, few enough to read. */
const MAX_ON_SCREEN = 6;
/** Gap between one word arriving and the next, in ms. */
const SPAWN_MS = 1500;
/** Gap between one character starting to draw and the next, in ms. */
const CHAR_MS = 85;
/** Dash length for a single glyph -- comfortably longer than any one outline. */
const CHAR_DASH = 420;

const TEXT: React.CSSProperties = {
  fontSize: 74,
  letterSpacing: "0.01em",
};

type ChalkTarget = { id: string; label: string; color: string };

type ActiveWord = ChalkPlacement & {
  /** Unique per appearance, so React remounts and the animation restarts. */
  key: number;
  target: ChalkTarget;
};

type Props = {
  /** The apps to write. */
  targets: readonly ChalkTarget[];
  /** Spin the machine to this app. */
  onPick: (id: string) => void;
  /** Hidden while the reels turn -- the backdrop is for the quiet moments. */
  hidden: boolean;
};

/**
 * App names writing themselves across the background, then dissolving, the way
 * ink sinks into Riddle's diary.
 *
 * Scheduled in JavaScript rather than looped in CSS, because the position has to
 * change every time a name comes back -- a CSS loop rewrites the same word into
 * the same spot forever. A timer brings in one word at a time, up to
 * {@link MAX_ON_SCREEN}, dropping the oldest as it goes, so words are always
 * arriving and leaving out of step with each other.
 *
 * The first render is deliberately empty: positions come from `Math.random()`,
 * and generating them during render would disagree between the server and the
 * first client pass.
 */
export default function ChalkBackdrop({ targets, onPick, hidden }: Props) {
  const [words, setWords] = useState<ActiveWord[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    if (targets.length === 0) return;
    const timers: number[] = [];

    const spawn = () => {
      setWords((prev) => {
        const target = pickUnused(
          targets,
          prev.map((w) => w.target.id),
        );
        if (!target) return prev;
        seq.current += 1;
        const next = prev.length >= MAX_ON_SCREEN ? prev.slice(1) : prev;
        return [
          ...next,
          {
            key: seq.current,
            target,
            // Steer clear of what is already up, or six random positions
            // collide often enough to look broken.
            ...placeChalkWord(Math.random, next),
          },
        ];
      });
    };

    // Stagger the opening fill, then keep one arriving at a steady interval.
    // The interval has to wait for the fill to finish: starting both at once
    // spawned two words per tick, so words were dropped before they had
    // finished writing and appeared to pop in fully formed.
    let interval: number | undefined;
    for (let i = 0; i < MAX_ON_SCREEN; i += 1) {
      timers.push(window.setTimeout(spawn, i * SPAWN_MS));
    }
    timers.push(
      window.setTimeout(() => {
        interval = window.setInterval(spawn, SPAWN_MS);
      }, MAX_ON_SCREEN * SPAWN_MS),
    );

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [targets]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-700 ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden={hidden}
    >
      {words.map((w) => {
        const chars = [...w.target.label];
        return (
          <button
            key={w.key}
            type="button"
            tabIndex={hidden ? -1 : 0}
            onClick={() => onPick(w.target.id)}
            aria-label={`Spin to ${w.target.label}`}
            className="pointer-events-auto absolute select-none rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50"
            style={{
              left: `${w.left}%`,
              top: `${w.top}%`,
              transform: `translate(-50%, -50%) rotate(${w.rotate}deg)`,
            }}
          >
            <svg
              height={`${w.size * 2}rem`}
              width={`${chars.length * w.size * 0.55}rem`}
              viewBox={`0 0 ${chars.length * 55} 110`}
              className="overflow-visible"
            >
              {/* Two identical layers of the same tspans: the one behind fills
                  in, the one on top traces its outline. Splitting into a tspan
                  per character is what makes it read as writing -- tracing the
                  whole word animates every glyph at once, which just looks like
                  a fade. The `backwards` fill-mode matters: without it a glyph
                  shows part of its dash before its delay elapses, which read as
                  the next word's first letter arriving early. */}
              <text x="0" y="78" className={caveat.className} style={TEXT}>
                {chars.map((ch, ci) => (
                  <tspan
                    key={`f${ci}`}
                    style={{
                      fill: w.target.color,
                      opacity: 0,
                      animation: `v4-chalk-fill ${w.duration}ms ${
                        ci * CHAR_MS
                      }ms ease-in-out backwards`,
                    }}
                  >
                    {ch === " " ? " " : ch}
                  </tspan>
                ))}
              </text>
              <text x="0" y="78" className={caveat.className} style={TEXT}>
                {chars.map((ch, ci) => (
                  <tspan
                    key={`s${ci}`}
                    style={{
                      fill: "none",
                      stroke: w.target.color,
                      strokeWidth: 1.4,
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeDasharray: CHAR_DASH,
                      strokeDashoffset: CHAR_DASH,
                      animation: `v4-chalk-write ${w.duration}ms ${
                        ci * CHAR_MS
                      }ms linear backwards`,
                    }}
                  >
                    {ch === " " ? " " : ch}
                  </tspan>
                ))}
              </text>
            </svg>
          </button>
        );
      })}
    </div>
  );
}
