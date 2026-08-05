import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const SlidingWindowContent = dynamic(() => import("./SlidingWindowContent"));

const TITLE = "Sliding Window";
const DESCRIPTION =
  "Track a contiguous range of elements. Interactive demos for Max Sum Subarray and Longest Substring Without Repeats.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/sliding-window",
  ogType: "website",
});

export default function SlidingWindowPage() {
  return <SlidingWindowContent />;
}
