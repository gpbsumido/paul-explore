"use client";

import { useState } from "react";
import { FEATURES, projectFor } from "./_data/catalog";
import IntroCard from "./IntroCard";

/**
 * Client shell for the work-portfolio page. Owns the single piece of state,
 * the selected feature index (null means the intro card is showing).
 * Tickers, stage nav, and the demo stage all hang off this.
 */
export default function WorkPortfolioContent() {
  const [selectedIndex] = useState<number | null>(null);

  const selected = selectedIndex === null ? null : FEATURES[selectedIndex];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex flex-1 items-stretch px-4 py-6" aria-label="Demo stage">
        <div className="mx-auto w-full max-w-4xl">
          {selected === null ? (
            <IntroCard />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                {projectFor(selected).name}
              </p>
              <h1 className="text-2xl font-bold text-foreground">
                {selected.title}
              </h1>
              <p className="text-[15px] text-muted">{selected.tagline}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
