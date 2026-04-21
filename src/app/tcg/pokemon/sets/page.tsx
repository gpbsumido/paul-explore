import TCGdex from "@tcgdex/sdk";
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

const tcgdex = new TCGdex("en");

// Set list doesn't change often — rebuild at most once a day
export const revalidate = 86400;

export default async function SetsPage() {
  let validSeries: Awaited<ReturnType<typeof tcgdex.serie.get>>[] = [];
  try {
    const resumes = await tcgdex.serie.list();
    const series = resumes
      ? await Promise.all(resumes.map((s) => tcgdex.serie.get(s.id)))
      : [];
    validSeries = series.filter(Boolean);
  } catch {
    // TCGdex unreachable at build time — ISR will repopulate on first request
  }

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
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Pocket
          </Link>
        }
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
          All Sets
        </h1>

        {validSeries.map((serie) => (
          <section key={serie!.id}>
            <div className="flex items-center gap-3 mb-4">
              {serie!.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${serie!.logo}.webp`}
                  alt={serie!.name}
                  className="h-7 object-contain"
                  loading="lazy"
                />
              ) : (
                <h2 className="text-xs font-black uppercase tracking-[0.15em] text-muted">
                  {serie!.name}
                </h2>
              )}
              <span className="text-xs text-muted">
                {serie!.sets.length} sets
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {serie!.sets.map((set) => (
                <Link
                  key={set.id}
                  href={`/tcg/pokemon/sets/${set.id}`}
                  className="group rounded-lg border border-border bg-surface hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/10 transition-[border-color,box-shadow] p-3 flex flex-col gap-2"
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
                      {set.cardCount.official}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
