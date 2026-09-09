"use client";

import Link from "next/link";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #cf9a3f)";

/**
 * The marquee features of this site, each a live link to the real page. Unlike
 * every other demo, nothing here is a reconstruction -- these open the actual
 * shipped routes.
 */
const LINKS = [
  {
    href: "/operator",
    icon: "🛠️",
    name: "Operator Dashboard",
    blurb: "The admin console behind the site: feature flags, updates, and ops.",
  },
  {
    href: "/calendar",
    icon: "🗓️",
    name: "Calendar",
    blurb: "A month/agenda calendar with events synced to a backing store.",
  },
  {
    href: "/thoughts",
    icon: "✍️",
    name: "Dev Thoughts",
    blurb: "Write-ups on how each feature was built, the wrong turns included.",
  },
  {
    href: "/tcg",
    icon: "🃏",
    name: "Pokémon TCG",
    blurb: "A card and set browser over a live trading-card API.",
  },
  {
    href: "/fantasy",
    icon: "🏀",
    name: "Fantasy & NBA",
    blurb: "Fantasy league history and NBA stats pulled from real feeds.",
  },
  {
    href: "/zeroproof",
    icon: "🎯",
    name: "ZeroProof",
    blurb: "A no-loss betting tracker with bankroll trends and a board.",
  },
  {
    href: "/vitals",
    icon: "📊",
    name: "Core Web Vitals",
    blurb: "Real field performance for this site, measured and charted.",
  },
  {
    href: "/updates",
    icon: "📣",
    name: "Updates Feed",
    blurb: "A running changelog of what shipped, release by release.",
  },
  {
    href: "/design-system",
    icon: "🎨",
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

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group flex h-full items-start gap-2.5 rounded-lg border border-border bg-background/40 p-3 transition-colors hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2"
              style={
                {
                  "--tw-ring-color": ACCENT,
                } as React.CSSProperties
              }
            >
              <span aria-hidden className="text-lg leading-none">
                {l.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[12px] font-semibold text-foreground">
                  {l.name}
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                    style={{ color: ACCENT }}
                  >
                    →
                  </span>
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
                  {l.blurb}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
