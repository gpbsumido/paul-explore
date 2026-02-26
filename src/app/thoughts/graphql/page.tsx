import type { Metadata } from "next";
import dynamic from "next/dynamic";
import ThoughtsSkeleton from "@/components/ThoughtsSkeleton";

export const metadata: Metadata = {
  title: "GraphQL | Thoughts",
  description:
    "Why GraphQL over REST, why plain fetch over Apollo, how the PokeAPI Hasura endpoint works, and the proxy pattern — in iMessage format.",
};

// Lazy-load so the chunk only lands in the browser when this page is visited.
const GraphQLThoughtsContent = dynamic(() => import("./GraphQLThoughtsContent"), {
  loading: () => <ThoughtsSkeleton />,
});

export default function GraphQLThoughtsPage() {
  return <GraphQLThoughtsContent />;
}
