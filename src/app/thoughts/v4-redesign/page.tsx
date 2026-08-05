import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import V4RedesignContent from "./V4RedesignContent";

const TITLE = "V4 Redesign | Thoughts";
const DESCRIPTION =
  "The landing and hub as a slot machine: three dependent reels derived from the same data as the graph, a decelerating spin with a reduced-motion path, and a listbox-based accessibility model.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/v4-redesign",
});

export const revalidate = 86400;

export default function V4RedesignThoughtsPage() {
  return <V4RedesignContent />;
}
