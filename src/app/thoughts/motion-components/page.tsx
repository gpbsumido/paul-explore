import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import MotionComponentsContent from "./MotionComponentsContent";

const TITLE = "Motion Components | Thoughts";
const DESCRIPTION =
  "Three motion-driven surfaces for the shared design system — TiltCard, GradientBackground, and Spotlight — plus a shared usePrefersReducedMotion hook, all built static-first so reduced motion is the default, not a fallback.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/motion-components`,
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

export default function MotionComponentsPage() {
  return <MotionComponentsContent />;
}
