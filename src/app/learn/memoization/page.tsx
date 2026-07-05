import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import dynamic from "next/dynamic";

const MemoizationContent = dynamic(() => import("./MemoizationContent"));

const TITLE = "Memoization";
const DESCRIPTION =
  "Cache function results so you never compute the same thing twice. Interactive cache visualizer, React.memo component tree demo, and build-from-scratch memoize utility.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/memoization`,
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

export default function MemoizationPage() {
  return <MemoizationContent />;
}
