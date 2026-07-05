import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import dynamic from "next/dynamic";

const SlidingWindowContent = dynamic(() => import("./SlidingWindowContent"), {
  ssr: false,
});

const TITLE = "Sliding Window";
const DESCRIPTION =
  "Track a contiguous range of elements. Interactive demos for Max Sum Subarray and Longest Substring Without Repeats.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/sliding-window`,
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

export default function SlidingWindowPage() {
  return <SlidingWindowContent />;
}
