import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import TCGdex, { Query } from "@tcgdex/sdk";
import BrowseContent from "./BrowseContent";
import { toPlain, type CardResume } from "@/lib/tcg";
import { SITE_URL, OG_IMAGE } from "@/lib/site";

const TITLE = "Pokémon TCG | Browse";
const DESCRIPTION =
  "Browse and search Pokémon TCG cards by name or type with infinite scroll.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/tcg/pokemon`,
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

// One TCGdex instance per server process — no reason to re-create it
// on every request. Same pattern as the /api/tcg/cards route.
const tcgdex = new TCGdex("en");
const PER_PAGE = 20;

/**
 * Fetches the first page of cards on the server so BrowseContent renders
 * real data on the initial paint instead of a client-side skeleton.
 *
 * We only fetch the unfiltered first page here — search and type filters
 * are handled client-side. If the user lands with ?q= or ?type= in the URL,
 * BrowseContent detects the mismatch and re-fetches with the correct params.
 *
 * Falls back gracefully if the SDK is unavailable at server time.
 */
async function BrowseWithData() {
  let initialCards: CardResume[] | undefined;
  try {
    const query = Query.create().sort("localId", "ASC").paginate(1, PER_PAGE);
    const rawCards = await tcgdex.card.list(query);
    initialCards = toPlain(rawCards ?? []);
  } catch {
    // TCGdex unavailable — BrowseContent will fall back to client-side fetch
  }
  return <BrowseContent initialCards={initialCards} />;
}

export default function PokemonTcgPage() {
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
            Pokémon TCG
          </span>
          <div className="ml-auto flex items-center gap-5">
            <Link
              href="/tcg/pokemon/sets"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Sets
            </Link>
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

      <Suspense fallback={<BrowseSkeleton />}>
        <BrowseWithData />
      </Suspense>
    </div>
  );
}

/**
 * Filter bar + card grid placeholder shown while BrowseWithData fetches.
 * Matches the real BrowseContent dimensions so the layout is stable when
 * the streamed content arrives.
 */
function BrowseSkeleton() {
  return (
    <>
      {/* filter bar — sits below the sticky nav (top-14) */}
      <div className="sticky top-14 z-10 h-14 border-b border-border bg-background/95" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg overflow-hidden border border-border bg-surface animate-pulse"
            >
              <div className="w-full bg-surface-raised" style={{ aspectRatio: "2.5/3.5" }} />
              <div className="px-2 py-1.5">
                <div className="h-2 w-2/3 rounded bg-surface-raised" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
