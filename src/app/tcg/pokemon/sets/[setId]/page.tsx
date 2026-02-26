import TCGdex from "@tcgdex/sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import SetCardsGrid from "./SetCardsGrid";

const tcgdex = new TCGdex("en");

// Set data is stable once published — rebuild at most once a day
export const revalidate = 86400;

// How many sets to pre-render at build time. We take the most recent ones
// since those are by far the most-visited pages right after a new release.
const STATIC_PRERENDER_COUNT = 10;

/**
 * Pre-renders the N most recent sets at build time so the first visitor
 * after a deploy hits a static page instead of a cold server render.
 * TCGdex returns sets oldest-first, so we slice from the tail.
 */
export async function generateStaticParams() {
  try {
    const sets = await tcgdex.set.list();
    if (!sets?.length) return [];
    return sets
      .slice(-STATIC_PRERENDER_COUNT)
      .map((s) => ({ setId: s.id }));
  } catch {
    // If the SDK is down at build time, skip static generation entirely —
    // the pages still work, they just render on first request instead.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ setId: string }>;
}): Promise<Metadata> {
  const { setId } = await params;
  const set = await tcgdex.set.get(setId);
  if (!set) return { title: "Set | Pokémon TCG" };
  return {
    title: `${set.name} | Pokémon TCG`,
    description: `Browse all cards in the ${set.name} set.`,
  };
}

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  const set = await tcgdex.set.get(setId);
  if (!set) notFound();

  const releaseYear = set.releaseDate?.split("-")[0];

  return (
    <div className="min-h-dvh bg-background font-sans">
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <Link
            href="/tcg/pokemon/sets"
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors shrink-0"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sets
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground truncate">
            {set.name}
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Set header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center gap-6">
          {set.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${set.logo}.webp`}
              alt={set.name}
              className="h-14 object-contain"
              loading="lazy"
            />
          )}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
              {set.name}
            </h1>
            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="uppercase tracking-wider">{set.serie.name}</span>
              {releaseYear && (
                <>
                  <span className="text-border">·</span>
                  <span>{releaseYear}</span>
                </>
              )}
              <span className="text-border">·</span>
              <span className="font-semibold text-foreground">
                {set.cardCount.official} cards
              </span>
              {set.symbol && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${set.symbol}.webp`}
                  alt="set symbol"
                  className="h-4 object-contain"
                  loading="lazy"
                />
              )}
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <LegalBadge label="Standard" legal={set.legal.standard} />
            <LegalBadge label="Expanded" legal={set.legal.expanded} />
          </div>
        </div>
      </div>

      <Suspense>
        <SetCardsGrid setId={setId} />
      </Suspense>
    </div>
  );
}

function LegalBadge({ label, legal }: { label: string; legal: boolean }) {
  return (
    <span
      className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${
        legal
          ? "bg-green-500/15 text-green-400 border-green-500/20"
          : "bg-surface text-muted border-border"
      }`}
    >
      {label} {legal ? "✓" : "✗"}
    </span>
  );
}
