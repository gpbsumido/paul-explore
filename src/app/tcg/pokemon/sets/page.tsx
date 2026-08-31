import { fetchCatalog } from "@/lib/tcg-catalog";
import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { SITE_URL, OG_IMAGE } from "@/lib/site";

const TITLE = "Pokémon TCG | Sets";
const DESCRIPTION = "All Pokémon TCG sets grouped by series.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/tcg/pokemon/sets`,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

// The set list renders from portfolio_api's mirrored catalog rather than from
// TCGdex directly. Rendering used to list every series and then fetch each one,
// and the cost of that fan-out is a multiple of however slow that API is: it
// timed out `next build`, and at request time produced an empty list that ISR
// then cached for a day, which reads as data nobody updated rather than as an
// outage. The mirror does the fan-out on a schedule instead.

// Rendered per request, not at build. The catalog read is a `no-store` fetch,
// which opts this route out of static generation -- and that is the property
// worth having: nothing about `next build` should depend on a network call any
// more, not even to our own API. The cost is absorbed upstream, where
// /api/tcg/catalog serves an hour of s-maxage.

export default async function SetsPage() {
  const catalog = await fetchCatalog();
  const series = catalog?.series ?? [];

  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Browse", href: "/tcg/pokemon" },
          { label: "Sets" },
        ]}
        right={
          <Link
            href="/tcg/pocket"
            className="paul-touch-min inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
          >
            Pocket
          </Link>
        }
      />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
          All Sets
        </h1>

        {/* A failed read and a catalog nobody has built yet look identical if
            you render both as "no sets", which is how an outage here spent a
            day passing for stale data. They say different things now. */}
        {catalog === null && (
          <p role="alert" className="text-sm text-muted">
            Couldn&apos;t load the set list just now. It&apos;s served from our
            own copy of the catalog, so this is us rather than the card
            database — try again shortly.
          </p>
        )}

        {catalog !== null && series.length === 0 && (
          <p className="text-sm text-muted">
            The set catalog hasn&apos;t been built yet. It fills in the next
            time the nightly import runs.
          </p>
        )}

        {series.map((serie) => (
          <section key={serie.id}>
            <div className="flex items-center gap-3 mb-4">
              {serie.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${serie.logo}.webp`}
                  alt={serie.name}
                  className="h-7 object-contain"
                  loading="lazy"
                />
              ) : (
                <h2 className="text-xs font-black uppercase tracking-[0.15em] text-muted">
                  {serie.name}
                </h2>
              )}
              <span className="text-xs text-muted">
                {serie.sets.length} sets
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {serie.sets.map((set) => (
                <Link
                  key={set.id}
                  href={`/tcg/pokemon/sets/${set.id}`}
                  className="group rounded-lg border border-border bg-surface hover:border-secondary-400/50 hover:shadow-lg hover:shadow-secondary-500/10 transition-[border-color,box-shadow] p-3 flex flex-col gap-2"
                >
                  {set.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${set.logo}.webp`}
                      alt={set.name}
                      className="h-10 object-contain object-left"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-sm font-bold text-foreground">
                      {set.name}
                    </span>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    {set.logo && (
                      <span className="text-[11px] text-muted truncate">
                        {set.name}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-muted shrink-0 ml-auto">
                      {set.cardCountOfficial ?? "—"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
