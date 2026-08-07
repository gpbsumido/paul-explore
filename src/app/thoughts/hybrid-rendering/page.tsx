import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import HybridRenderingContent from "./HybridRenderingContent";

const TITLE = "Hybrid Rendering | Thoughts";
const DESCRIPTION =
  "Giving the angular-paul desktop clone the render mode each route actually needs — the SEO-critical Thoughts pages prerender to static HTML at build time via per-route RenderMode, a SeoService writes the head and JSON-LD on the server, while the interactive shell stays client-rendered.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/hybrid-rendering",
});

export const revalidate = 86400;

export default function HybridRenderingThoughtsPage() {
  return <HybridRenderingContent />;
}
