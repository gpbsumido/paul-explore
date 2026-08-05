import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import GraphQLThoughtsContent from "./GraphQLThoughtsContent";

const TITLE = "GraphQL | Thoughts";
const DESCRIPTION =
  "Why GraphQL over REST, why plain fetch over Apollo, how the PokeAPI Hasura endpoint works, and the proxy pattern — in iMessage format.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/graphql",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function GraphQLThoughtsPage() {
  return <GraphQLThoughtsContent />;
}
