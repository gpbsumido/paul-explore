import TCGdex from "@tcgdex/sdk";
import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Pokémon TCG | Sets",
  description: "All Pokémon TCG sets grouped by series.",
};

const tcgdex = new TCGdex("en");

export default async function SetsPage() {
  const resumes = await tcgdex.serie.list();
  const series = resumes
    ? await Promise.all(resumes.map((s) => tcgdex.serie.get(s.id)))
    : [];
  const validSeries = series.filter(Boolean);

  return (
    <div className="min-h-dvh bg-background font-sans">
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <Link
            href="/tcg/pokemon"
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors shrink-0"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Browse
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground">
            Sets
          </span>
          <div className="ml-auto flex items-center gap-5">
            <Link
              href="/tcg/pocket"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Pocket
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

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
                  className="group rounded-lg border border-border bg-surface hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/10 transition-all p-3 flex flex-col gap-2"
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
