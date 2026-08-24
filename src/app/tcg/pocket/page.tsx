import TCGdex from "@tcgdex/sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import PageHeader from "@/components/PageHeader";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import { loadPocketGate } from "@/lib/flags-gate";
import { VISITOR_COOKIE } from "@/lib/visitor";

const TITLE = "Pokémon TCG Pocket";
const DESCRIPTION =
  "Browse Pokémon TCG Pocket sets grouped by expansion family.";

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

// Gating reads the per-visitor cookie, so this route renders dynamically rather
// than as a cached static page — the on/off decision is made fresh per visitor.
export const dynamic = "force-dynamic";

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
  const visitorKey =
    (await cookies()).get(VISITOR_COOKIE)?.value ?? "anonymous";
  const gate = await loadPocketGate(visitorKey);
  if (!gate.enabled) {
    return <PocketNotRolledOut />;
  }

  // force-dynamic means this fetch runs on every request, so a tcgdex outage
  // would otherwise throw and render nothing — no main landmark, a broken page.
  // Degrade to an accessible unavailable state instead.
  let serie: Awaited<ReturnType<typeof tcgdex.serie.get>> | null = null;
  try {
    serie = await tcgdex.serie.get("tcgp");
  } catch {
    serie = null;
  }
  if (!serie) {
    return <PocketUnavailable />;
  }

  const sets = serie.sets as unknown as SetResume[];
  const totalOfficial = sets.reduce((n, s) => n + s.cardCount.official, 0);
  const groups = groupSets(sets);

  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "TCG Pocket" },
        ]}
        right={
          <>
            <Link
              href="/tcg/pokemon"
              className="paul-touch-min inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/tcg/pokemon/sets"
              className="paul-touch-min inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
            >
              Sets
            </Link>
          </>
        }
      />

      <main>
        <h1 className="sr-only">Pokémon Pocket</h1>

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-b from-primary-950 via-primary-950/60 to-background">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-0 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl" />
            <div className="absolute right-1/4 top-8 w-64 h-64 rounded-full bg-secondary-500/10 blur-3xl" />
          </div>
          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-14 flex flex-col items-start gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://assets.tcgdex.net/en/tcgp/A1/logo.webp"
              alt="Pokémon TCG Pocket"
              className="h-12 object-contain"
            />
            <p className="text-sm text-primary-300/80 max-w-md leading-relaxed">
              The mobile card game — 20-card decks, immersive battles, and cards
              that come to life.
            </p>
            <div className="flex gap-8">
              <Stat value={sets.length} label="Sets" />
              <div className="w-px bg-primary-500/20" />
              <Stat value={totalOfficial.toLocaleString()} label="Cards" />
              <div className="w-px bg-primary-500/20" />
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
                    className="group col-span-1 rounded-xl overflow-hidden border border-border bg-surface hover:border-secondary-400/50 hover:shadow-xl hover:shadow-secondary-500/10 transition-[border-color,box-shadow]"
                  >
                    <div className="bg-gradient-to-br from-primary-950/80 to-primary-900/30 px-5 py-6 flex items-center gap-4">
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
                          <span className="text-muted font-normal text-xs">
                            {" "}
                            / {primary.cardCount.total}
                          </span>
                        </span>
                        <span className="text-[10px] text-muted uppercase tracking-widest">
                          {primary.id}
                        </span>
                      </div>
                      <svg
                        width="8"
                        height="14"
                        viewBox="0 0 8 14"
                        fill="none"
                        className="text-muted group-hover:text-secondary-400 transition-colors shrink-0"
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

                  {/* Mini-sets */}
                  {mini.map((set) => (
                    <Link
                      key={set.id}
                      href={`/tcg/pokemon/sets/${set.id}`}
                      className="group rounded-xl border border-border bg-surface hover:border-secondary-400/50 hover:shadow-lg hover:shadow-secondary-500/10 transition-[border-color,box-shadow] p-4 flex flex-col gap-3"
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
                          <span className="text-xs text-muted truncate">
                            {set.name}
                          </span>
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
      </main>
    </div>
  );
}

/**
 * Shown when the pocket-tcg flag resolves off for this visitor. Honest about
 * why: the page is behind a real feature flag and this visitor's sticky bucket
 * currently falls outside the rollout.
 */
function PocketNotRolledOut() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "TCG Pocket" },
        ]}
      />
      <main className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="rounded-full bg-surface-raised px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
          Feature flag
        </span>
        <h1 className="text-2xl font-bold text-foreground">
          Pokémon TCG Pocket isn&apos;t rolled out to you yet
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          This page sits behind a real feature flag, evaluated for you
          server-side on a stable, anonymous visitor key. Your bucket currently
          falls outside the rollout, so you see this instead — and it stays
          consistent every time you visit rather than flickering on and off.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          You can watch the flag that decides this, and change its rollout, in
          the{" "}
          <Link
            href="/flags"
            className="font-medium text-primary-600 underline-offset-2 hover:underline dark:text-primary-400"
          >
            feature flags console
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

/**
 * Shown when the tcgdex set database can't be reached. Renders the full page
 * shell — header and a main landmark — so the page degrades to a readable,
 * accessible state rather than a broken one when a third party is down.
 */
function PocketUnavailable() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "TCG Pocket" },
        ]}
      />
      <main className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Pocket sets are unavailable right now
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          The card database didn&apos;t respond. This page reads live from a
          third-party set index; refresh in a moment to try again.
        </p>
      </main>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-black text-white">{value}</span>
      <span className="text-[10px] text-primary-300/70 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
