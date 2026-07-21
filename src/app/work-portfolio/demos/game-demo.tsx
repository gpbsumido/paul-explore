"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #22d3ee)";

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
  const [target, setTarget] = useState<Target | null>(null);

  const start = () => {
    setPhase("loading");
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = p + 9 + Math.random() * 11;
        if (next >= 100) {
          clearInterval(timer);
          setScore(0);
          setTarget(spawn(1));
          setPhase("playing");
          return 100;
        }
        return next;
      });
    }, 120);
  };

  const hit = () => {
    setScore((s) => s + 1);
    setTarget((t) => spawn((t?.id ?? 0) + 1));
  };

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">
          {feature.title}
        </p>
        {phase === "playing" && (
          <span className="font-mono text-[12px] text-cyan-300">
            Score: {score}
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

        {phase === "playing" && (
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
