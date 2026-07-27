import type { Metadata } from "next";
import PokemonHub from "./PokemonHub";
import { SITE_URL, OG_IMAGE } from "@/lib/site";

const TITLE = "Pokémon";
const DESCRIPTION =
  "One home for the Pokémon apps in this project — the TCG card browser, the TCG Pocket expansions, and the GraphQL Pokédex.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/pokemon`,
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

// The hub is a fixed set of links to the three Pokémon apps, so it can be a
// fully static page. No data fetching, nothing to revalidate.
export const dynamic = "force-static";

/**
 * The Pokémon hub. Three of the project's apps are all built on Pokémon data —
 * this page gathers them behind one door so they read as a single suite in the
 * apps list rather than three near-identical cards.
 */
export default function PokemonPage() {
  return <PokemonHub />;
}
