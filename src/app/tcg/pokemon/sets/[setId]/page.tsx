import TCGdex from "@tcgdex/sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import SetCardsGrid from "./SetCardsGrid";

const tcgdex = new TCGdex("en");

// Set data is stable once published — rebuild at most once a day
export const revalidate = 86400;

/**
 * Nothing is pre-rendered here, deliberately.
 *
 * This used to return the ten most recent sets so the first visitor after a
 * deploy hit a static page. The cost of that turned out to be a third party
 * holding a veto over every build: pre-rendering a set means fetching it
 * during `next build`, and any set that does not come back cleanly ends the
 * export -- `Export encountered an error on /tcg/pokemon/sets/[setId]/page`,
 * exit 1. That failed the nightly on `me02`, then failed PR CI on `B2`, on a
 * branch that already carried a fix for the first symptom.
 *
 * Guarding individual fields chases symptoms one set at a time. The class of
 * failure only goes away when the build stops calling the API at all, which is
 * what returning nothing does. With `revalidate` above, the first request for
 * a set renders and caches it for a day, so the loss is one cold render per
 * set per day against a build that cannot be broken from outside.
 */
export async function generateStaticParams(): Promise<{ setId: string }[]> {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ setId: string }>;
}): Promise<Metadata> {
  const { setId } = await params;
  const set = await tcgdex.set.get(setId).catch(() => null);
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
  const set = await tcgdex.set.get(setId).catch(() => null);
  if (!set) notFound();

  const releaseYear = set.releaseDate?.split("-")[0];

  // A set that has only just been announced turns up in the list with parts of
  // its record still missing. Reading through those blind failed the whole
  // production build, so every one of them is optional here.
  const serieName = set.serie?.name;
  const officialCount = set.cardCount?.official;

  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Sets", href: "/tcg/pokemon/sets" },
          { label: set.name },
        ]}
      />

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
              {serieName && (
                <span className="uppercase tracking-wider">{serieName}</span>
              )}
              {releaseYear && (
                <>
                  <span className="text-border">·</span>
                  <span>{releaseYear}</span>
                </>
              )}
              {officialCount !== undefined && (
                <>
                  <span className="text-border">·</span>
                  <span className="font-semibold text-foreground">
                    {officialCount} cards
                  </span>
                </>
              )}
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
            <LegalBadge label="Standard" legal={set.legal?.standard} />
            <LegalBadge label="Expanded" legal={set.legal?.expanded} />
          </div>
        </div>
      </div>

      <Suspense>
        <SetCardsGrid setId={setId} />
      </Suspense>
    </div>
  );
}

function LegalBadge({
  label,
  legal,
}: {
  label: string;
  /** Undefined for a set whose legality upstream has not decided yet. */
  legal?: boolean;
}) {
  return (
    <span
      className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${
        legal
          ? "bg-success-500/15 text-success-400 border-success-500/20"
          : "bg-surface text-muted border-border"
      }`}
    >
      {label} {legal ? "✓" : "✗"}
    </span>
  );
}
