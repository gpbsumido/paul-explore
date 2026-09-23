"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { ACCENT_BAND } from "@/lib/accentBand";
import FantasyNflNav from "./FantasyNflNav";

/** The fantasy football pages, surfaced as cards from the section hub. */
const PAGES = [
  {
    href: "/fantasy/nfl/matchups",
    title: "Matchups",
    description:
      "Head-to-head weekly matchups: team scores, each starter's actual and projected fantasy points, and a projection-based win probability that narrows as games are played.",
    color: ACCENT_BAND.teal,
  },
] as const;

/** Landing hub for the fantasy football section. */
export default function FantasyNflHubContent() {
  return (
    <PageShell
      colorA="var(--color-feature-nfl)"
      colorB="var(--color-primary-500)"
      className="font-sans"
    >
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Fantasy NFL" },
        ]}
        maxWidth="max-w-5xl"
      />
      <FantasyNflNav />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Fantasy NFL
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            My ESPN fantasy football league, week by week — pick a page to jump
            in.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="glass-card flex h-full flex-col rounded-xl p-4 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm"
            >
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                {p.title}
              </p>
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
