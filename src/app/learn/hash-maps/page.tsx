import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const HashMapsContent = dynamic(() => import("./HashMapsContent"));

const TITLE = "Hash Maps & Sets";
const DESCRIPTION =
  "Trade space for speed. O(1) lookup changes what's possible. Interactive demos for Two Sum with a hash map and Set operations.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/hash-maps",
  ogType: "website",
});

export default function HashMapsPage() {
  return <HashMapsContent />;
}
