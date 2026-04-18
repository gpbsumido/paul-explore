import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import LandingPageContent from "./LandingPageContent";

const TITLE = "Landing Page | Thoughts";
const DESCRIPTION =
  "Scroll animations, weather canvas, R3F section models, frameloop demand rendering, IntersectionObserver pause-on-scroll, reduced motion guards, and touch controls.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/landing-page`,
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

export default function LandingPageThoughtsPage() {
  return <LandingPageContent />;
}
