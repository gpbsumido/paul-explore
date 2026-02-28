import TCGdex from "@tcgdex/sdk";
import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { SITE_URL, OG_IMAGE } from "@/lib/site";

const TITLE = "Pokémon TCG Pocket";
const DESCRIPTION = "Browse Pokémon TCG Pocket sets grouped by expansion family.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/tcg/pocket`,
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

// Pocket sets are updated infrequently — rebuild at most once a day
export const revalidate = 86400;

type SetResume = {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount: { official: number; total: number };
};

function expansionKey(id: string): string {
  if (id.startsWith("P-")) return id;
  const m = id.match(/^([A-Z]\d+)/);
  return m ? m[1] : id;
}

function groupSets(sets: SetResume[]): [string, SetResume[]][] {
  const map = new Map<string, SetResume[]>();
  for (const set of sets) {
    const key = expansionKey(set.id);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(set);
  }
  return Array.from(map.entries());
}

export default async function PocketPage() {
  const serie = await tcgdex.serie.get("tcgp");
  if (!serie) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted text-sm">
        Failed to load Pocket data.
      </div>
    );
  }

  const sets = serie.sets as unknown as SetResume[];
  const totalOfficial = sets.reduce((n, s) => n + s.cardCount.official, 0);
  const groups = groupSets(sets);

  return (
    <div className="min-h-dvh bg-background font-sans">
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <Link
            href="/protected"
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors shrink-0"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground">
            TCG Pocket
          </span>
          <div className="ml-auto flex items-center gap-5">
            <Link
              href="/tcg/pokemon"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/tcg/pokemon/sets"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Sets
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-indigo-950/60 to-background">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute right-1/4 top-8 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl" />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-14 flex flex-col items-start gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://assets.tcgdex.net/en/tcgp/A1/logo.webp"
            alt="Pokémon TCG Pocket"
            className="h-12 object-contain"
          />
          <p className="text-sm text-indigo-300/80 max-w-md leading-relaxed">
            The mobile card game — 20-card decks, immersive battles, and cards
            that come to life.
          </p>
          <div className="flex gap-8">
            <Stat value={sets.length} label="Sets" />
            <div className="w-px bg-indigo-500/20" />
            <Stat value={totalOfficial.toLocaleString()} label="Cards" />
            <div className="w-px bg-indigo-500/20" />
            <Stat value={groups.length} label="Expansions" />
          </div>
        </div>
      </div>

      {/* Expansion groups */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-10">
        {groups.map(([key, groupSets]) => {
          const [primary, ...mini] = groupSets;
          const isPromo = key.startsWith("P-");
          return (
            <section key={key}>
              <h2 className="text-xs font-black uppercase tracking-[0.15em] text-muted mb-4">
                {isPromo ? "Promotional Cards" : primary.name}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Primary set */}
                <Link
                  href={`/tcg/pokemon/sets/${primary.id}`}
                  className="group col-span-1 rounded-xl overflow-hidden border border-border bg-surface hover:border-red-400/50 hover:shadow-xl hover:shadow-red-500/10 transition-all"
                >
                  <div className="bg-gradient-to-br from-indigo-950/80 to-indigo-900/30 px-5 py-6 flex items-center gap-4">
                    {primary.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${primary.logo}.webp`}
                        alt={primary.name}
                        className="h-14 object-contain object-left shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-base font-black text-foreground uppercase tracking-wide">
                        {primary.name}
                      </span>
                    )}
                    <div className="ml-auto flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-black text-foreground">
                        {primary.cardCount.official}
                        <span className="text-muted font-normal text-xs"> / {primary.cardCount.total}</span>
                      </span>
                      <span className="text-[10px] text-muted uppercase tracking-widest">{primary.id}</span>
                    </div>
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="text-muted group-hover:text-red-400 transition-colors shrink-0">
                      <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>

                {/* Mini-sets */}
                {mini.map((set) => (
                  <Link
                    key={set.id}
                    href={`/tcg/pokemon/sets/${set.id}`}
                    className="group rounded-xl border border-border bg-surface hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/10 transition-all p-4 flex flex-col gap-3"
                  >
                    {set.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${set.logo}.webp`}
                        alt={set.name}
                        className="h-8 object-contain object-left"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-sm font-black text-foreground uppercase tracking-wide">
                        {set.name}
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      {set.logo && (
                        <span className="text-xs text-muted truncate">{set.name}</span>
                      )}
                      <span className="text-xs font-semibold text-muted ml-auto shrink-0">
                        {set.cardCount.official} cards
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-black text-white">{value}</span>
      <span className="text-[10px] text-indigo-300/70 uppercase tracking-widest">{label}</span>
    </div>
  );
}
