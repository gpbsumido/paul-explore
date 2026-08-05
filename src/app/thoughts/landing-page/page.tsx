import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import LandingPageContent from "./LandingPageContent";

const TITLE = "Landing Page | Thoughts";
const DESCRIPTION =
  "Scroll animations, weather canvas, R3F section models, frameloop demand rendering, IntersectionObserver pause-on-scroll, reduced motion guards, and touch controls.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/landing-page",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function LandingPageThoughtsPage() {
  return <LandingPageContent />;
}
