import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import DesignSystemShowcaseThoughtsContent from "./DesignSystemShowcaseThoughtsContent";

const TITLE = "Design System Showcase | Thoughts";
const DESCRIPTION =
  "Building a live, in-app gallery for the shared design system — dogfooding the primitives, a data-driven catalog with an integrity test, an interactive props playground, and an axe-checked accessibility contract.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/design-system-showcase`,
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

export default function DesignSystemShowcaseThoughtsPage() {
  return <DesignSystemShowcaseThoughtsContent />;
}
