"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import FantasyNav from "./FantasyNav";

/** The fantasy NBA pages, surfaced as cards from the section hub. */
const PAGES = [
  {
    href: "/fantasy/nba/playoffs",
    title: "Playoffs Bracket",
    description:
      "Pick every series winner, length, and Finals MVP. Debounced auto-save and a public leaderboard.",
    color: "#f43f5e",
  },
  {
    href: "/fantasy/nba/player/stats",
    title: "Player Stats",
    description:
      "Live player stats via an API proxy, with per-player error states and skeleton rows while data loads.",
    color: "#007aff",
  },
  {
    href: "/fantasy/nba/matchups",
    title: "Matchups",
    description:
      "Head-to-head weekly matchups with category breakdowns, animated win bars, and a prediction panel.",
    color: "#ff6b35",
  },
  {
    href: "/fantasy/nba/court-vision",
    title: "Court Vision",
    description:
      "An SVG half-court shot chart with color-coded shooting zones and per-zone FG%.",
    color: "#00d4ff",
  },
  {
    href: "/fantasy/nba/league-history",
    title: "League History",
    description:
      "ESPN fantasy basketball standings by season, with expandable rosters and a season selector.",
    color: "#ff9500",
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
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Fantasy NBA
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Everything NBA in one place — pick a page to jump in.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
