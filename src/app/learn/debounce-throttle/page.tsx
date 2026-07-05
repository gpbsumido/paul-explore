import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import dynamic from "next/dynamic";

const DebounceThrottleContent = dynamic(
  () => import("./DebounceThrottleContent"),
  { ssr: false },
);

const TITLE = "Debounce & Throttle";
const DESCRIPTION =
  "Debounce waits for silence, throttle fires at a fixed rate. Interactive click timeline, leading vs trailing edge diagrams, and build-from-scratch implementations.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/debounce-throttle`,
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

export default function DebounceThrottlePage() {
  return <DebounceThrottleContent />;
}
