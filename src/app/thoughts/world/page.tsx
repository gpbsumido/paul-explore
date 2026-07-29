import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import WorldThoughtsContent from "./WorldThoughtsContent";

export const metadata: Metadata = {
  title: "Explore Toronto | Thoughts",
  description:
    "How the walkable 3D Toronto was built: a TDD'd pure movement core, an R3F shell around it, a seeded procedural skyline over a real street grid, and exhibits that deep-link every feature.",
  openGraph: {
    title: "Explore Toronto | Thoughts",
    description:
      "Building a keyboard-driven 3D city out of primitives, with the game logic as pure tested functions.",
    url: `${SITE_URL}/thoughts/world`,
    type: "article",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Toronto | Thoughts",
    description:
      "Building a keyboard-driven 3D city out of primitives, with the game logic as pure tested functions.",
  },
};

export const revalidate = 86400;

export default function WorldThoughtsPage() {
  return <WorldThoughtsContent />;
}
