import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import dynamic from "next/dynamic";

const DebounceThrottleContent = dynamic(
  () => import("./DebounceThrottleContent"),
);

const TITLE = "Debounce & Throttle";
const DESCRIPTION =
  "Debounce waits for silence, throttle fires at a fixed rate. Interactive click timeline, leading vs trailing edge diagrams, and build-from-scratch implementations.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/debounce-throttle",
  ogType: "website",
});

export default function DebounceThrottlePage() {
  return <DebounceThrottleContent />;
}
