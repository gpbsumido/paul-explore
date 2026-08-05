import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import GalleryWallThoughtsContent from "./GalleryWallThoughtsContent";

const TITLE = "Gallery Wall | Thoughts";
const DESCRIPTION =
  "Building the gallery wall arranger pure-core-first: standard frame sizes, an aspect-matching auto-framer, a centered shelf-packing layout with overflow detection, an inches-internal model with a cm toggle at the edge, and a to-scale SVG preview.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/gallery-wall",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function GalleryWallThoughtsPage() {
  return <GalleryWallThoughtsContent />;
}
