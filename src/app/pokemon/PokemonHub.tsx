"use client";

import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import {
  TcgPreview,
  PocketPreview,
  GraphQLPreview,
} from "@/app/_shared/featureData";

type PokemonApp = {
  title: string;
  description: string;
  href: string;
  color: string;
  thoughtsHref?: string;
  Preview: React.ComponentType;
};

// The three apps this hub gathers. Order runs richest-first: the full TCG
// browser, then TCG Pocket, then the GraphQL Pokédex.
const APPS: PokemonApp[] = [
  {
    title: "Pokémon TCG",
    description:
      "Card browser with infinite scroll, URL-synced filters, per-set grids, and deep card detail pages — built on the TCGdex SDK.",
    href: "/tcg/pokemon",
    color: "#ef4444",
    thoughtsHref: "/thoughts/tcg",
    Preview: TcgPreview,
  },
  {
    title: "TCG Pocket",
    description:
      "All Pokémon TCG Pocket expansions — sets, packs, and individual card pages with full metadata and ISR caching.",
    href: "/tcg/pocket",
    color: "#6366f1",
    Preview: PocketPreview,
  },
  {
    title: "GraphQL Pokédex",
    description:
      "Pokémon browser on the PokeAPI Hasura endpoint. Plain fetch over Apollo, typed queries, streaming SSR, and a live query inspector.",
    href: "/graphql",
    color: "#14b8a6",
    thoughtsHref: "/thoughts/graphql",
    Preview: GraphQLPreview,
  },
];

/**
 * The Pokémon hub UI. A short intro and one card per sub-app. Each card reuses
 * the same mini-preview mockups the home feature cards use, so the suite looks
 * of a piece with the rest of the site.
 */
export default function PokemonHub() {
  return (
    <PageShell colorA="#ef4444" colorB="#6366f1" className="font-sans">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Pokémon" }]}
      />

      <main className="reveal-up mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pokémon</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Three apps in this project are all built on Pokémon data. They live
            here together — pick one to jump in.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map((app, i) => (
            <AppCard key={app.href} app={app} index={i} />
          ))}
        </div>
      </main>
    </PageShell>
  );
}

/** One link card for a sub-app: a themed preview, the blurb, and the links. */
function AppCard({ app, index }: { app: PokemonApp; index: number }) {
  return (
    <div
      style={{ animationDelay: `${0.08 + index * 0.06}s` }}
      className="reveal-up flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-transform duration-200 ease-out hover:-translate-y-1"
    >
      <div
        className="overflow-hidden"
        style={{
          height: 112,
          background: `color-mix(in srgb, ${app.color} 8%, transparent)`,
        }}
      >
        <div className="p-3">
          <app.Preview />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-2">
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: app.color }}
          />
          <h2 className="text-[15px] font-semibold leading-snug text-foreground">
            {app.title}
          </h2>
        </div>

        <p className="flex-1 text-[13px] leading-relaxed text-muted">
          {app.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          {app.thoughtsHref ? (
            <Link
              href={app.thoughtsHref}
              className="text-[13px] text-muted transition-colors hover:text-foreground"
            >
              About
            </Link>
          ) : (
            <div />
          )}
          <Link
            href={app.href}
            className="text-[13px] font-semibold transition-opacity hover:opacity-75"
            style={{ color: app.color }}
          >
            Open →
          </Link>
        </div>
      </div>
    </div>
  );
}
