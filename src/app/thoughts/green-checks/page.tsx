import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import GreenChecksContent from "./GreenChecksContent";

const TITLE = "Green Checks | Thoughts";
const DESCRIPTION =
  "Four green checks in the design system repo that were each measuring something other than what they claimed — a test suite no pipeline ran, a visual gate with no snapshot quota left, a contrast figure taken under the gloss that was hiding it, and a test count that changed depending on whether you had built.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/green-checks",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function GreenChecksPage() {
  return <GreenChecksContent />;
}
