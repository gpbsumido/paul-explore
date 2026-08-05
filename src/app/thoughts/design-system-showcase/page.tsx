import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import DesignSystemShowcaseThoughtsContent from "./DesignSystemShowcaseThoughtsContent";

const TITLE = "Design System Showcase | Thoughts";
const DESCRIPTION =
  "Building a live, in-app gallery for the shared design system — dogfooding the primitives, a data-driven catalog with an integrity test, an interactive props playground, and an axe-checked accessibility contract.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/design-system-showcase",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function DesignSystemShowcaseThoughtsPage() {
  return <DesignSystemShowcaseThoughtsContent />;
}
