import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import SiteRedesignContent from "./SiteRedesignContent";

const TITLE = "One mockup, the whole site | Thoughts";
const DESCRIPTION =
  "Taking a one-page mockup across seventy routes by changing four shared pieces: a header that floats into a pill without a second nav, a drifting grid that loops because it's one cell too big, the cyan the palette sweep rejected, and numbers the build computes instead of the mockup's typed ones.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/site-redesign",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function SiteRedesignPage() {
  return <SiteRedesignContent />;
}
