import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import TreesGraphsContent from "./TreesGraphsContent";

const TITLE = "Trees & Graphs";
const DESCRIPTION =
  "Nodes and edges. Most tree and graph problems boil down to traversal order. Interactive DFS/BFS demos for trees and shortest-path BFS for graphs.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/trees-graphs`,
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

export default function TreesGraphsPage() {
  return <TreesGraphsContent />;
}
