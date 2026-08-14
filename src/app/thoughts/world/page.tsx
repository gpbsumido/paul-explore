import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import WorldThoughtsContent from "./WorldThoughtsContent";

const TITLE = "Explore Toronto | Thoughts";
const DESCRIPTION =
  "How the walkable 3D Toronto was built: a TDD'd pure movement core, an R3F shell around it, a seeded procedural skyline over a real street grid, and exhibits that deep-link back into the site.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/world",
});

export const revalidate = 86400;

export default function WorldThoughtsPage() {
  return <WorldThoughtsContent />;
}
