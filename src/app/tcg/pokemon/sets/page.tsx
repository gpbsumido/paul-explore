import TCGdex from "@tcgdex/sdk";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const tcgdex = new TCGdex("en");

export default async function SetsPage() {
  const resumes = await tcgdex.serie.list();
  const series = resumes
    ? await Promise.all(resumes.map((s) => tcgdex.serie.get(s.id)))
    : [];
  const validSeries = series.filter(Boolean);

  return (
    <div className="flex flex-col min-h-dvh max-w-[480px] mx-auto font-sans bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-center px-4 py-3 bg-background border-b border-border backdrop-blur-xl">
        <Link
          href="/tcg/pokemon"
          className="absolute left-4 text-[#007aff] text-sm flex items-center gap-0.5"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path
              d="M9 1L2 8l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          &nbsp;Back
        </Link>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-base font-semibold text-foreground">Sets</span>
          <span className="text-[11px] text-muted">Browse by series</span>
        </div>
        <div className="absolute right-4">
          <ThemeToggle />
        </div>
      </div>

      {/* Series list */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-8">
        {validSeries.map((serie) => (
          <section key={serie!.id}>
            <div className="flex items-center gap-3 mb-3">
              {serie!.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${serie!.logo}.webp`}
                  alt={serie!.name}
                  className="h-6 object-contain"
                  loading="lazy"
                />
              )}
              {!serie!.logo && (
                <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted">
                  {serie!.name}
                </h2>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {serie!.sets.map((set) => (
                <Link
                  key={set.id}
                  href={`/tcg/pokemon/sets/${set.id}`}
                  className="rounded-xl border border-border bg-surface hover:border-primary-400 hover:shadow-md transition-all p-3 flex flex-col gap-2"
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
                    <span className="text-[13px] font-semibold text-foreground">
                      {set.name}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    {set.logo && (
                      <span className="text-[12px] text-muted truncate">
                        {set.name}
                      </span>
                    )}
                    <span className="text-[11px] text-muted shrink-0 ml-auto">
                      {set.cardCount.official} cards
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
