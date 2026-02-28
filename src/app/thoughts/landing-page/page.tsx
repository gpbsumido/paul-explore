import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import LandingPageContent from "./LandingPageContent";

const TITLE = "Landing Page | Thoughts";
const DESCRIPTION = "How I built the landing page";

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

export default function SearchBarPage() {
  return <LandingPageContent />;
}
