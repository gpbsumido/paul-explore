"use client";

import { useEffect, useRef, useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, hsl(186 54% 49%))";
const ROUND_SECONDS = 20;

// A CRT scanline overlay and a chunky cabinet glow give this project its own
// retro-arcade look, distinct from every other demo.
const SCANLINES =
  "repeating-linear-gradient(rgba(0,0,0,0.32) 0 1px, transparent 1px 3px)";
const arcade = "font-mono uppercase";

type Phase = "idle" | "loading" | "playing";
type Target = { id: number; x: number; y: number };

const spawn = (id: number): Target => ({
  id,
  x: 8 + Math.random() * 84,
  y: 14 + Math.random() * 72,
});

/**
 * Vignette: the conference game demo. The original was a game-engine build
 * embedded via WebGL. Here the booth build loads to completion and drops you
 * into a small reflex minigame, standing in for the real embedded game.
 */
export default function GameDemoFrame({ feature }: { feature: WorkFeature }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [target, setTarget] = useState<Target | null>(null);
  const [best, setBest] = usePersistentState("wp-game-best", 0);
  // Mirrors the loading progress so the interval can decide when to finish
  // without doing side effects inside the setProgress updater.
  const progressRef = useRef(0);

  const over = phase === "playing" && timeLeft === 0;

  const start = () => {
    setPhase("loading");
    setProgress(0);
    progressRef.current = 0;
    const timer = setInterval(() => {
      const next = progressRef.current + 9 + Math.random() * 11;
      if (next >= 100) {
        clearInterval(timer);
        progressRef.current = 100;
        setProgress(100);
        setScore(0);
        setTimeLeft(ROUND_SECONDS);
        setTarget(spawn(1));
        setPhase("playing");
      } else {
        progressRef.current = next;
        setProgress(next);
      }
    }, 120);
  };

  // Round countdown while playing; the "over" state is derived from timeLeft.
  // The updater stays pure (clamps at 0); cleanup stops the interval.
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => {
      setTimeLeft((tl) => (tl <= 1 ? 0 : tl - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const hit = () => {
    if (over) return;
    const next = score + 1;
    setScore(next);
    setBest((b) => Math.max(b, next));
    setTarget((t) => spawn((t?.id ?? 0) + 1));
  };

  return (
    <div
      className="flex min-h-full flex-col gap-3 p-5"
      style={{ background: "hsl(30 16% 6%)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`${arcade} text-[10px] tracking-[0.35em]`}
            style={{ color: ACCENT }}
          >
            ★ Insert coin
          </p>
          <p
            className={`${arcade} text-lg font-bold tracking-[0.12em] text-foreground sm:text-xl`}
            style={{ textShadow: `0 0 14px ${ACCENT}` }}
          >
            {feature.title}
          </p>
        </div>
        {phase === "playing" && !over && (
          <span
            className={`${arcade} rounded border px-2 py-1 text-[12px] tabular-nums`}
            style={{ color: ACCENT, borderColor: ACCENT }}
          >
            Score: {score} · {timeLeft}s
          </span>
        )}
      </div>

      <div
        className="relative min-h-56 flex-1 overflow-hidden rounded-xl"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 18%, color-mix(in srgb, var(--wp-accent, hsl(186 54% 49%)) 26%, transparent), transparent 60%), hsl(30 18% 4%)",
          border: `2px solid ${ACCENT}`,
          boxShadow: `inset 0 0 40px color-mix(in srgb, ${ACCENT} 30%, transparent), 0 0 24px color-mix(in srgb, ${ACCENT} 25%, transparent)`,
        }}
      >
        {/* CRT scanlines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 opacity-60"
          style={{ backgroundImage: SCANLINES }}
        />
        {phase === "idle" && (
          <div className="relative z-20 flex h-full flex-col items-center justify-center gap-4">
            <p
              className={`${arcade} text-[11px] tracking-[0.3em]`}
              style={{ color: ACCENT }}
            >
              Booth Build v0.9
            </p>
            <button
              type="button"
              onClick={start}
              className={`${arcade} rounded-md border-2 px-6 py-2.5 text-[14px] font-bold tracking-[0.1em] transition-transform hover:scale-105 active:scale-95`}
              style={{
                color: ACCENT,
                borderColor: ACCENT,
                boxShadow: `0 0 18px color-mix(in srgb, ${ACCENT} 55%, transparent)`,
              }}
            >
              ▶ Start demo
            </button>
            <p className={`${arcade} motion-safe:animate-pulse text-[9px] tracking-[0.4em] text-muted`}>
              Press start
            </p>
          </div>
        )}

        {phase === "loading" && (
          <div className="relative z-20 flex h-full flex-col items-center justify-center gap-3 px-8">
            <p className={`${arcade} text-[11px] tracking-[0.15em]`} style={{ color: ACCENT }}>
              compiling booth build… {Math.round(progress)}%
            </p>
            <div className="h-2 w-full max-w-xs overflow-hidden rounded-sm border border-white/15 bg-black/40">
              <div
                className="h-full transition-[width] duration-150"
                style={{
                  width: `${progress}%`,
                  background: ACCENT,
                  boxShadow: `0 0 10px ${ACCENT}`,
                }}
              />
            </div>
          </div>
        )}

        {phase === "playing" && !over && (
          <div className="relative z-20 h-full w-full">
            <p
              className={`${arcade} absolute top-2 left-2 text-[10px] tracking-[0.2em]`}
              style={{ color: ACCENT }}
            >
              tap the targets
            </p>
            {target && (
              <button
                type="button"
                aria-label="Hit target"
                onClick={hit}
                className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/50 transition-transform active:scale-90"
                style={{
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                  backgroundColor: ACCENT,
                  boxShadow: `0 0 12px ${ACCENT}`,
                }}
              />
            )}
          </div>
        )}

        {over && (
          <div className="relative z-20 flex h-full flex-col items-center justify-center gap-2 text-center">
            <p
              className={`${arcade} text-[12px] tracking-[0.4em]`}
              style={{ color: ACCENT, textShadow: `0 0 14px ${ACCENT}` }}
            >
              Time!
            </p>
            <p className={`${arcade} text-[16px] font-bold tracking-[0.1em] text-foreground`}>
              Score {score} · Best {best}
            </p>
            <button
              type="button"
              onClick={start}
              className={`${arcade} mt-1 rounded-md border-2 px-6 py-2.5 text-[13px] font-bold tracking-[0.1em] transition-transform hover:scale-105 active:scale-95`}
              style={{
                color: ACCENT,
                borderColor: ACCENT,
                boxShadow: `0 0 18px color-mix(in srgb, ${ACCENT} 55%, transparent)`,
              }}
            >
              ▶ Play again
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-muted">
        The original was a game-engine build shown at a conference and embedded
        in the analytics portal through a WebGL canvas that streamed gameplay
        events back into the same pipeline. This reflex game is a lightweight
        stand-in for that embedded build.
      </p>
    </div>
  );
}
