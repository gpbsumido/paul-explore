import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import BinarySearchContent from "./BinarySearchContent";

const TITLE = "Binary Search";
const DESCRIPTION =
  "Cut the search space in half every step. Interactive demos for classic binary search and search-the-answer-space patterns.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/binary-search`,
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

export default function BinarySearchPage() {
  return <BinarySearchContent />;
}
