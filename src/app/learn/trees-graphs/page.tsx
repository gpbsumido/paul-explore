import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const TreesGraphsContent = dynamic(() => import("./TreesGraphsContent"));

const TITLE = "Trees & Graphs";
const DESCRIPTION =
  "Nodes and edges. Most tree and graph problems boil down to traversal order. Interactive DFS/BFS demos for trees and shortest-path BFS for graphs.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/trees-graphs",
  ogType: "website",
});

export default function TreesGraphsPage() {
  return <TreesGraphsContent />;
}
