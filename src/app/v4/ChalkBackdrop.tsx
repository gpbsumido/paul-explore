"use client";

import { useEffect, useRef, useState } from "react";
import { TegakiRenderer } from "tegaki/react";
import caveat from "tegaki/fonts/caveat";
import {
  placeChalkWord,
  pickUnused,
  type ChalkPlacement,
  type KeepOut,
} from "./chalkLayout";

/** Most words on screen at once. Few enough that each one is readable. */
const MAX_ON_SCREEN = 4;
/** Gap between one word arriving and the next, in ms. Unhurried on purpose. */
const SPAWN_MS = 2600;
/** Pause between glyphs, in seconds -- tegaki's own stagger. Brisk: a backdrop
 *  that writes slowly reads as sluggish rather than considered. */
const GLYPH_GAP = 0.025;

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
  // Held in a ref, not state: the spawn timer reads the latest zones without
  // a re-measure restarting it, and nothing renders from them directly.
  const keepOut = useRef<KeepOut>([]);

  // Measure the bits of the interface a word must not cover. Percentages
  // hard-coded from one window drift on every other, and the machine's
  // container is taller than a short window, so avoiding the container wholesale
  // banned the entire screen. These are the elements that actually matter.
  useEffect(() => {
    const measure = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      if (!vh || !vw) return;
      const rect = (el: Element) => {
        const r = el.getBoundingClientRect();
        return {
          left: (r.left / vw) * 100,
          right: (r.right / vw) * 100,
          top: (r.top / vh) * 100,
          bottom: (r.bottom / vh) * 100,
        };
      };
      const targetsToAvoid = [
        document.querySelector("header"),
        ...document.querySelectorAll("[data-chalk-avoid]"),
        document.querySelector('[data-testid="reel-lens"]'),
        // The reel columns carry the dimmed option lists; a word written across
        // one makes both unreadable.
        ...document.querySelectorAll('[role="listbox"]'),
        document.querySelector('[aria-label="Spin the reels"]'),
        // The result panel sits below the machine and is easy to write over.
        document.querySelector("[data-chalk-result]"),
      ].filter((el): el is Element => el !== null);
      keepOut.current = targetsToAvoid.map(rect);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

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
        const next = prev.length >= MAX_ON_SCREEN ? prev.slice(1) : prev;
        // Steer clear of what is already up, or six random positions collide
        // often enough to look broken. Null means the window is too short to
        // place anything without covering the interface.
        // Words are centred on their anchor, so the placement has to know how
        // far they reach or a long one hangs across the interface while its
        // midpoint sits clear. Rough is fine: it only has to bound the word.
        const remPx = 16;
        const halfW =
          ((target.label.length * 1.6 * 0.55 * remPx) / 2 / window.innerWidth) * 100;
        const halfH = ((1.6 * remPx) / 2 / window.innerHeight) * 100;
        const placement = placeChalkWord(
          Math.random,
          next,
          keepOut.current,
          target.label.length,
          { halfW, halfH },
        );
        if (!placement) return prev;
        seq.current += 1;
        return [...next, { key: seq.current, target, ...placement }];
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
      // Decoration, and hidden from assistive tech and the tab order entirely.
      // Clicking a name is a shortcut, not the only route: the reels are fully
      // keyboard-operable (arrows to move, Enter to open) and the spin button is
      // right there. Putting these in the tab order would be actively hostile --
      // they come and go every few seconds, so focus would land on a word and
      // then vanish out from under it.
      aria-hidden
    >
      {words.map((w) => {
        return (
          <button
            key={w.key}
            type="button"
            tabIndex={-1}
            onClick={() => onPick(w.target.id)}
            className="pointer-events-auto absolute cursor-pointer select-none rounded"
            style={{
              left: `${w.left}%`,
              top: `${w.top}%`,
              transform: `translate(-50%, -50%) rotate(${w.rotate}deg)`,
            }}
          >
            {/* tegaki draws the pen's own path, stroke by stroke, rather than
                tracing around the glyph outline the way a stroke-dasharray on
                SVG text does. That difference is the whole reason to take the
                dependency: an outline trace reads as a shape being outlined,
                this reads as handwriting. */}
            <TegakiRenderer
              font={caveat}
              timing={{ glyphGap: GLYPH_GAP }}
              style={{
                fontSize: `${w.size}rem`,
                color: w.target.color,
                // The written line then dissolves, the way ink sinks into the
                // page. Held here rather than in tegaki, which only draws.
                animation: `v4-chalk-life ${w.duration}ms ease-in-out both`,
              }}
            >
              {w.target.label}
            </TegakiRenderer>
          </button>
        );
      })}
    </div>
  );
}
