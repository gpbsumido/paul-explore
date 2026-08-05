import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const BinarySearchContent = dynamic(() => import("./BinarySearchContent"));

const TITLE = "Binary Search";
const DESCRIPTION =
  "Cut the search space in half every step. Interactive demos for classic binary search and search-the-answer-space patterns.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/binary-search",
  ogType: "website",
});

export default function BinarySearchPage() {
  return <BinarySearchContent />;
}
