import type { Metadata } from "next";
import GraphQLThoughtsContent from "./GraphQLThoughtsContent";

export const metadata: Metadata = {
  title: "GraphQL | Thoughts",
  description:
    "Why GraphQL over REST, why plain fetch over Apollo, how the PokeAPI Hasura endpoint works, and the proxy pattern — in iMessage format.",
};

export default function GraphQLThoughtsPage() {
  return <GraphQLThoughtsContent />;
}
