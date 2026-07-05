import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import dynamic from "next/dynamic";

const AsyncContent = dynamic(() => import("./AsyncContent"), { ssr: false });

const TITLE = "Async Patterns";
const DESCRIPTION =
  "JavaScript is single-threaded. Interactive event loop simulator, Promise.all vs race vs allSettled timelines, and sequential vs parallel pitfalls.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/async-patterns`,
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

export default function AsyncPatternsPage() {
  return <AsyncContent />;
}
