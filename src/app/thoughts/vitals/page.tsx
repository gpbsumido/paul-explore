import type { Metadata } from "next";
import dynamic from "next/dynamic";
import ThoughtsSkeleton from "@/components/ThoughtsSkeleton";

export const metadata: Metadata = {
  title: "Web Vitals | Thoughts",
  description:
    "Why I built a real-user vitals pipeline instead of just using Lighthouse — the collection stack, sendBeacon, P75, and what field data actually tells you.",
};

// Lazy-load so the chunk only lands when this page is visited.
const WebVitalsContent = dynamic(() => import("./WebVitalsContent"), {
  loading: () => <ThoughtsSkeleton />,
});

export default function WebVitalsThoughtsPage() {
  return <WebVitalsContent />;
}
