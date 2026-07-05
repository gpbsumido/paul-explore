import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import dynamic from "next/dynamic";

const HashMapsContent = dynamic(() => import("./HashMapsContent"), {
  ssr: false,
});

const TITLE = "Hash Maps & Sets";
const DESCRIPTION =
  "Trade space for speed. O(1) lookup changes what's possible. Interactive demos for Two Sum with a hash map and Set operations.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/hash-maps`,
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

export default function HashMapsPage() {
  return <HashMapsContent />;
}
