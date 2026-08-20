"use client";

import Link from "next/link";
import ScrollProgress from "@/components/motion/ScrollProgress";
import LandingActions from "@/app/v4/LandingActions";
import Hero from "./sections/Hero";
import Proof from "./sections/Proof";
import CraftSpine from "./sections/CraftSpine";
import FeaturedWork from "./sections/FeaturedWork";
import Writing from "./sections/Writing";
import Archive from "./sections/Archive";
import Contact from "./sections/Contact";
import { SHELL } from "./shell";

export type V5ContentProps = {
  /** Index into HERO_TAGLINES, baked once per ISR regeneration of /. */
  taglineIndex?: number;
  /** Write-up hrefs for the shortlist, baked with the tagline. */
  writingPicks?: string[];
};

/**
 * The v5 landing, both auth states.
 *
 * Guest and signed-in see the same argument in the same order, because the page
 * is aimed at someone deciding whether to interview me and that does not change
 * when I happen to be logged in on my own laptop. The session only changes the
 * header: the auth call to action flips, and the menu already carries the
 * signed-in routes. That one control resolves its own state client-side (see
 * LandingActions), which is what lets / render statically with no session
 * read at all. No second bar under the hero.
 */
export default function V5Content({
  taglineIndex,
  writingPicks,
}: V5ContentProps) {
  return (
    <div className="relative">
      <ScrollProgress height={2} />

      {/* Sticky, with its own surface. The theme, settings and auth controls
          live here, and they should stay reachable at any scroll depth. The
          backdrop is what keeps the bar readable over the proof figures. */}
      <header className="sticky top-0 z-[var(--z-sticky)] h-16 border-b border-border/60 bg-background/75 backdrop-blur-md">
        <div className={`${SHELL} flex h-16 items-center justify-between`}>
          <Link
            href="/"
            className="font-display text-sm font-semibold tracking-tight"
          >
            paul-explore
          </Link>
          <LandingActions />
        </div>
      </header>

      <main>
        <Hero taglineIndex={taglineIndex} />
        <Proof />
        <CraftSpine />
        <FeaturedWork />
        <Writing picks={writingPicks} />
        <Archive />
        <Contact />
      </main>
    </div>
  );
}
