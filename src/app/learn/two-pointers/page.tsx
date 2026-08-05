import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const TwoPointersContent = dynamic(() => import("./TwoPointersContent"));

const TITLE = "Two Pointers";
const DESCRIPTION =
  "Walk both ends toward the middle. Interactive demos for Two Sum on a sorted array and removing duplicates in-place.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/two-pointers",
  ogType: "website",
});

export default function TwoPointersPage() {
  return <TwoPointersContent />;
}
