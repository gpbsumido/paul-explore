"use client";

import Link from "next/link";
import Image from "next/image";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #cf9a3f)";

/**
 * The marquee features of this site, each a live link to the real page with a
 * real screengrab of it. Unlike every other demo, nothing here is a
 * reconstruction -- these open the actual shipped routes. Every href is a
 * public route that renders for a signed-out visitor (verified live).
 */
const LINKS = [
  {
    href: "/operator",
    shot: "/work-portfolio/thumbs/operator.png",
    name: "Operator Dashboard",
    blurb: "The admin console behind the site: feature flags, updates, and ops.",
  },
  {
    href: "/world",
    shot: "/work-portfolio/thumbs/world.png",
    name: "The 3D World",
    blurb: "An explorable low-poly world rendered with React Three Fiber.",
  },
  {
    href: "/thoughts",
    shot: "/work-portfolio/thumbs/thoughts.png",
    name: "Dev Thoughts",
    blurb: "Write-ups on how each feature was built, the wrong turns included.",
  },
  {
    href: "/pokemon",
    shot: "/work-portfolio/thumbs/pokemon.png",
    name: "Pokémon TCG",
    blurb: "A card and set browser over a live trading-card API.",
  },
  {
    href: "/fantasy/nba",
    shot: "/work-portfolio/thumbs/fantasy.png",
    name: "Fantasy & NBA",
    blurb: "Fantasy league history and NBA stats pulled from real feeds.",
  },
  {
    href: "/zeroproof",
    shot: "/work-portfolio/thumbs/zeroproof.png",
    name: "ZeroProof",
    blurb: "A no-loss betting tracker with bankroll trends and a board.",
  },
  {
    href: "/vitals",
    shot: "/work-portfolio/thumbs/vitals.png",
    name: "Core Web Vitals",
    blurb: "Real field performance for this site, measured and charted.",
  },
  {
    href: "/updates",
    shot: "/work-portfolio/thumbs/updates.png",
    name: "Updates Feed",
    blurb: "A running changelog of what shipped, release by release.",
  },
  {
    href: "/design-system",
    shot: "/work-portfolio/thumbs/design-system.png",
    name: "Design System",
    blurb: "The component library and tokens the whole site is built from.",
  },
] as const;

/**
 * Vignette: the site itself. A directory of the real features of paul-explore,
 * each opening its actual page rather than a canned reconstruction.
 */
export default function ThisSiteDemo({ feature }: { feature: WorkFeature }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">
          {feature.title}
        </p>
        <p className="text-[11px] text-muted">
          Live links — these open the real pages.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group block overflow-hidden rounded-xl border border-border bg-background/40 transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2"
              style={
                {
                  "--tw-ring-color": ACCENT,
                } as React.CSSProperties
              }
            >
              <span className="relative block aspect-[16/10] overflow-hidden bg-surface">
                <Image
                  src={l.shot}
                  alt={`Screenshot of the ${l.name} page`}
                  fill
                  sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                />
              </span>
              <span className="flex items-start justify-between gap-2 p-3">
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-foreground">
                    {l.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
                    {l.blurb}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: ACCENT }}
                >
                  →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
