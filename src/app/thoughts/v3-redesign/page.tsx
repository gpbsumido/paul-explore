import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import V3RedesignContent from "./V3RedesignContent";

const TITLE = "V3 Redesign | Thoughts";
const DESCRIPTION =
  "The whole site as an interactive node graph: a hand-rolled force simulation, a fit-to-viewport renderer, the drag/hover bugs nobody warns you about, and an accessibility audit.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/v3-redesign",
});

export const revalidate = 86400;

export default function V3RedesignThoughtsPage() {
  return <V3RedesignContent />;
}
