import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import GraphQLThoughtsContent from "./GraphQLThoughtsContent";

const TITLE = "GraphQL | Thoughts";
const DESCRIPTION =
  "Why GraphQL over REST, why plain fetch over Apollo, how the PokeAPI Hasura endpoint works, and the proxy pattern — in iMessage format.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/graphql`,
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

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function GraphQLThoughtsPage() {
  return <GraphQLThoughtsContent />;
}
