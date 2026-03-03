import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import LandingPageContent from "./LandingPageContent";

const TITLE = "Landing Page | Thoughts";
const DESCRIPTION =
  "Scroll animations with no dependencies, CSS keyframes for the hero entrance, design tokens across every section, and a Three.js particle network in the background.";

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

export default function LandingPageThoughtsPage() {
  return <LandingPageContent />;
}
