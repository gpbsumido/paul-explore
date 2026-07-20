"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #22d3ee)";

/**
 * Vignette: the conference game demo. The real thing was a game-engine build
 * embedded via WebGL; here it's a faux frame with a start screen and a note
 * on how the embed worked, since the actual build isn't shipped.
 */
export default function GameDemoFrame({ feature }: { feature: WorkFeature }) {
  const [started, setStarted] = useState(false);

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div
        className="relative min-h-40 flex-1 overflow-hidden rounded-lg border border-border"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 20%, rgba(34,211,238,0.25), transparent 60%), #0b0f14",
        }}
      >
        {!started ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
              Booth Build v0.9
            </p>
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="rounded-full px-5 py-2 text-[13px] font-bold text-black"
              style={{ backgroundColor: ACCENT }}
            >
              ▶ Start demo
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div
              aria-hidden
              className="h-14 w-14 animate-spin rounded-lg"
              style={{ backgroundColor: ACCENT, animationDuration: "3s" }}
            />
            <p className="font-mono text-[11px] text-cyan-200">running WebGL scene…</p>
            <button
              type="button"
              onClick={() => setStarted(false)}
              className="text-[11px] text-cyan-300/70 underline"
            >
              reset
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-muted">
        The original was a game-engine build shown at a conference and embedded
        in the analytics portal through a WebGL canvas that streamed gameplay
        events back into the same pipeline. This is a stand-in frame, the real
        build isn&apos;t shipped here.
      </p>
    </div>
  );
}
