"use client";

import { useEffect, useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #22d3ee)";
const ROUND_SECONDS = 20;

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

  const over = phase === "playing" && timeLeft === 0;

  const start = () => {
    setPhase("loading");
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = p + 9 + Math.random() * 11;
        if (next >= 100) {
          clearInterval(timer);
          setScore(0);
          setTimeLeft(ROUND_SECONDS);
          setTarget(spawn(1));
          setPhase("playing");
          return 100;
        }
        return next;
      });
    }, 120);
  };

  // Round countdown while playing; the "over" state is derived from timeLeft.
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) {
          clearInterval(timer);
          return 0;
        }
        return tl - 1;
      });
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
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">
          {feature.title}
        </p>
        {phase === "playing" && !over && (
          <span className="font-mono text-[12px] text-cyan-300">
            Score: {score} · {timeLeft}s
          </span>
        )}
      </div>

      <div
        className="relative min-h-40 flex-1 overflow-hidden rounded-lg border border-border"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 20%, rgba(34,211,238,0.25), transparent 60%), #0b0f14",
        }}
      >
        {phase === "idle" && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
              Booth Build v0.9
            </p>
            <button
              type="button"
              onClick={start}
              className="rounded-full px-5 py-2 text-[13px] font-bold text-black"
              style={{ backgroundColor: ACCENT }}
            >
              ▶ Start demo
            </button>
          </div>
        )}

        {phase === "loading" && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8">
            <p className="font-mono text-[11px] text-cyan-200">
              compiling booth build… {Math.round(progress)}%
            </p>
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-150"
                style={{ width: `${progress}%`, backgroundColor: ACCENT }}
              />
            </div>
          </div>
        )}

        {phase === "playing" && !over && (
          <div className="h-full w-full">
            <p className="absolute left-2 top-2 font-mono text-[10px] text-cyan-300/70">
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
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
              Time!
            </p>
            <p className="text-[15px] font-bold text-cyan-100">
              Score {score} · Best {best}
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-1 rounded-full px-5 py-2 text-[13px] font-bold text-black"
              style={{ backgroundColor: ACCENT }}
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
