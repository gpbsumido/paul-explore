import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import ResearchExplorerContent from "./ResearchExplorerContent";

const TITLE = "Measuring the Literature to Find a Research Topic | Thoughts";
const DESCRIPTION =
  "A vascular surgery resident needs a research project, and the hard part isn't generating ideas — it's knowing which idea is unclaimed. Scoring candidate topics against PubMed, deriving topics from what the field is publishing, and using demographic coverage as the gap finder.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/research-explorer",
});

export const revalidate = 86400;

export default function ResearchExplorerThoughtsPage() {
  return <ResearchExplorerContent />;
}
