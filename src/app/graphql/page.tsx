import { Suspense } from "react";
import type { Metadata } from "next";
import GraphQLContent from "./GraphQLContent";
import { fetchPokemonDirect } from "@/lib/graphql";
import { PAGE_SIZE, type PokemonListResult } from "@/types/graphql";
import { SITE_URL, OG_IMAGE } from "@/lib/site";

const TITLE = "GraphQL Pokédex";
const DESCRIPTION =
  "Browse 1,000+ Pokémon with a live GraphQL query — search by name, filter by type, view base stats. Powered by the PokeAPI Hasura endpoint via a Next.js proxy.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/graphql`,
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

// Pokémon data changes infrequently -- cache for an hour so repeat visits
// don't hammer PokeAPI and the first byte arrives from the CDN instead.
export const revalidate = 3600;

/**
 * Fetches page 1 of Pokémon on the server and hands it down to GraphQLContent
 * so the grid is populated on the first paint rather than after a client-side
 * effect. The Suspense boundary in GraphQLPage shows GraphQLSkeleton while
 * this resolves.
 *
 * If PokeAPI is unavailable we fall back gracefully — GraphQLContent still
 * renders and will retry the fetch in the browser.
 */
async function PokemonWithData() {
  let initialData: PokemonListResult | undefined;
  try {
    initialData = await fetchPokemonDirect("", "", PAGE_SIZE, 0);
  } catch {
    // upstream down or cold-start timeout — client will handle it
  }
  return <GraphQLContent initialData={initialData} />;
}

export default function GraphQLPage() {
  return (
    <Suspense fallback={<GraphQLSkeleton />}>
      <PokemonWithData />
    </Suspense>
  );
}

/**
 * Placeholder shown by the Suspense boundary while PokemonWithData fetches.
 * Mirrors the real layout (nav bar + card grid) so there's no layout shift
 * when the streamed content drops in.
 */
function GraphQLSkeleton() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      {/* nav height placeholder — keeps the skeleton the right size */}
      <div className="h-[57px] border-b border-border bg-background/95" />
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        <div className="h-10 rounded-lg bg-surface animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface h-44 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
