import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import RenderPerfContent from "./RenderPerfContent";

const TITLE = "Render Performance | Thoughts";
const DESCRIPTION =
  "A systematic pass through runtime rendering costs: context value instability, resize handler allocation, backdrop-filter GPU pressure, unbounded DOM growth, and transition-all waste.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/render-perf",
});

export const revalidate = 86400;

export default function RenderPerfThoughtsPage() {
  return <RenderPerfContent />;
}
