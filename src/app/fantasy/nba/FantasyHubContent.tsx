"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { ACCENT_BAND } from "@/lib/accentBand";
import FeatureTour from "@/components/GuidedTour/FeatureTour";
import type { TourStep } from "@/components/GuidedTour/types";
import FantasyNav from "./FantasyNav";

/** A quick walk-through of the Fantasy NBA hub for a first-time visitor. */
const TOUR_STEPS: TourStep[] = [
  {
    title: "Take a quick tour?",
    body: "New here? I'll show you what the Fantasy NBA hub does and how to get around — a few clicks, no commitment.",
  },
  {
    anchor: "fx-hub-title",
    title: "The Fantasy NBA hub",
    body: "This is the single entry point to every NBA tool — brackets, matchups, player stats, and more.",
  },
  {
    anchor: "fx-nav",
    title: "Jump anywhere",
    body: "The tab bar takes you straight to any section from any page — Matchups, Playoffs, Player Stats and the rest.",
  },
  {
    anchor: "fx-page-grid",
    title: "Pick a tool",
    body: "Or start from a card here — each opens one tool and says what it does before you dive in.",
  },
];

/** The fantasy NBA pages, surfaced as cards from the section hub. */
const PAGES = [
  {
    href: "/fantasy/nba/playoffs",
    title: "Playoffs Bracket",
    description:
      "Pick every series winner, length, and Finals MVP. Debounced auto-save and a public leaderboard.",
    color: ACCENT_BAND.coral,
  },
  {
    href: "/fantasy/nba/player/stats",
    title: "Player Stats",
    description:
      "Live player stats via an API proxy, with per-player error states and skeleton rows while data loads.",
    color: ACCENT_BAND.azure,
  },
  {
    href: "/fantasy/nba/matchups",
    title: "Matchups",
    description:
      "Head-to-head weekly matchups with category breakdowns, animated win bars, and a prediction panel.",
    color: ACCENT_BAND.ember,
  },
  {
    href: "/fantasy/nba/court-vision",
    title: "Court Vision",
    description:
      "An SVG half-court shot chart with color-coded shooting zones and per-zone FG%.",
    color: ACCENT_BAND.teal,
  },
  {
    href: "/fantasy/nba/league-history",
    title: "League History",
    description:
      "ESPN fantasy basketball standings by season, with expandable rosters and a season selector.",
    color: ACCENT_BAND.gold,
  },
  {
    href: "/fantasy/nba/cards",
    title: "Card Lab",
    description:
      "Every rostered player's season minted as a trading card, with rarity set by how they did relative to the pool.",
    color: ACCENT_BAND.violet,
  },
] as const;

/** Landing hub for the fantasy NBA section: one entry point to all its pages. */
export default function FantasyHubContent() {
  return (
    <PageShell colorA="var(--color-feature-nba)" colorB="var(--color-primary-500)" className="font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Fantasy NBA" },
        ]}
        maxWidth="max-w-5xl"
      />
      <FantasyNav />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1
              id="fx-hub-title"
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              Fantasy NBA
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Everything NBA in one place — pick a page to jump in.
            </p>
          </div>
          <FeatureTour
            label="Fantasy"
            storageKey="fantasy-tour-seen"
            steps={TOUR_STEPS}
          />
        </header>

        <div
          id="fx-page-grid"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="glass-card flex h-full flex-col rounded-xl p-4 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm"
              style={{ borderLeftWidth: 3, borderLeftColor: p.color }}
            >
              <p className="font-semibold text-foreground">{p.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {p.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
