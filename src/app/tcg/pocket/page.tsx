import TCGdex from "@tcgdex/sdk";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const tcgdex = new TCGdex("en");

type SetResume = {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount: { official: number; total: number };
};

/** Group by expansion family: A1/A1a → "A1", A2/A2a/A2b → "A2", P-A alone, etc. */
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
      <div className="flex min-h-dvh items-center justify-center text-muted text-[15px]">
        Failed to load Pocket data.
      </div>
    );
  }

  const sets = serie.sets as unknown as SetResume[];
  const totalOfficial = sets.reduce((n, s) => n + s.cardCount.official, 0);
  const groups = groupSets(sets);

  return (
    <div className="flex flex-col min-h-dvh max-w-[480px] mx-auto font-sans bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-center px-4 py-3 bg-background border-b border-border backdrop-blur-xl">
        <Link
          href="/protected"
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
          <span className="text-base font-semibold text-foreground">
            TCG Pocket
          </span>
          <span className="text-[11px] text-muted">Pokémon TCG Pocket</span>
        </div>
        <div className="absolute right-4">
          <ThemeToggle />
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-indigo-950/80 to-background px-4 pt-8 pb-10 flex flex-col items-center gap-4 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        {/* Series logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://assets.tcgdex.net/en/tcgp/A1/logo.webp"
          alt="Pokémon TCG Pocket"
          className="relative h-10 object-contain"
        />

        <p className="relative text-[13px] text-indigo-300/80 max-w-[280px] leading-relaxed">
          The mobile card game — 20-card decks, immersive battles, and cards
          that come to life.
        </p>

        {/* Stats row */}
        <div className="relative flex gap-6">
          <Stat value={sets.length} label="Sets" />
          <div className="w-px bg-indigo-500/20" />
          <Stat value={totalOfficial.toLocaleString()} label="Cards" />
          <div className="w-px bg-indigo-500/20" />
          <Stat value={groups.length} label="Expansions" />
        </div>
      </div>

      {/* Expansion groups */}
      <div className="flex flex-col gap-6 px-4 py-6">
        {groups.map(([key, groupSets]) => {
          const [primary, ...mini] = groupSets;
          const isPromo = key.startsWith("P-");
          return (
            <section key={key}>
              {/* Section label */}
              <h2 className="text-[11px] uppercase tracking-widest font-semibold text-muted mb-3 px-0.5">
                {isPromo ? "Promotional Cards" : primary.name}
              </h2>

              {/* Primary set — full width */}
              <Link
                href={`/tcg/pokemon/sets/${primary.id}`}
                className="group block rounded-2xl overflow-hidden border border-border bg-surface hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-500/5 transition-all mb-3"
              >
                <div className="relative bg-gradient-to-br from-indigo-950/60 to-indigo-900/30 px-5 py-5 flex items-center gap-4">
                  {primary.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${primary.logo}.webp`}
                      alt={primary.name}
                      className="h-12 object-contain object-left shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[15px] font-bold text-foreground">
                      {primary.name}
                    </span>
                  )}
                  <div className="ml-auto flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[13px] font-semibold text-foreground">
                      {primary.cardCount.official}
                      <span className="text-muted font-normal">
                        {" "}
                        / {primary.cardCount.total}
                      </span>
                    </span>
                    <span className="text-[10px] text-muted uppercase tracking-wider">
                      {primary.id}
                    </span>
                  </div>
                  {/* arrow */}
                  <svg
                    width="8"
                    height="14"
                    viewBox="0 0 8 14"
                    fill="none"
                    className="text-muted group-hover:text-indigo-400 transition-colors"
                  >
                    <path
                      d="M1 1l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Link>

              {/* Mini-sets — 2 col grid */}
              {mini.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {mini.map((set) => (
                    <Link
                      key={set.id}
                      href={`/tcg/pokemon/sets/${set.id}`}
                      className="group rounded-xl border border-border bg-surface hover:border-indigo-400/60 hover:shadow-md transition-all p-3 flex flex-col gap-2"
                    >
                      {set.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${set.logo}.webp`}
                          alt={set.name}
                          className="h-7 object-contain object-left"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-[13px] font-semibold text-foreground leading-tight">
                          {set.name}
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        {set.logo && (
                          <span className="text-[11px] text-muted truncate">
                            {set.name}
                          </span>
                        )}
                        <span className="text-[11px] text-muted ml-auto shrink-0">
                          {set.cardCount.official} cards
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xl font-bold text-white">{value}</span>
      <span className="text-[11px] text-indigo-300/70 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
