import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import GalleryWallThoughtsContent from "./GalleryWallThoughtsContent";

const TITLE = "Gallery Wall | Thoughts";
const DESCRIPTION =
  "Building the gallery wall arranger pure-core-first: standard frame sizes, an aspect-matching auto-framer, a centered shelf-packing layout with overflow detection, an inches-internal model with a cm toggle at the edge, and a to-scale SVG preview.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/gallery-wall`,
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

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function GalleryWallThoughtsPage() {
  return <GalleryWallThoughtsContent />;
}
