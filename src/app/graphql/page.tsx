import { Suspense } from "react";
import type { Metadata } from "next";
import GraphQLContent from "./GraphQLContent";
import GraphQLSkeleton from "./GraphQLSkeleton";
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
