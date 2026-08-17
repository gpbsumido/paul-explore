import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import V5RedesignContent from "./V5RedesignContent";

const TITLE = "V5 Redesign | Thoughts";
const DESCRIPTION =
  "Retiring the slot machine from the root: a custom palette and display face, eight in-house motion primitives, and a landing page written for a hiring manager with ten minutes.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/v5-redesign",
});

export const revalidate = 86400;

export default function V5RedesignThoughtsPage() {
  return <V5RedesignContent />;
}
