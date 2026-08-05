import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import MotionComponentsContent from "./MotionComponentsContent";

const TITLE = "Motion Components | Thoughts";
const DESCRIPTION =
  "Three motion-driven surfaces for the shared design system — TiltCard, GradientBackground, and Spotlight — plus a shared usePrefersReducedMotion hook, all built static-first so reduced motion is the default, not a fallback.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/motion-components",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function MotionComponentsPage() {
  return <MotionComponentsContent />;
}
