import type { Metadata } from "next";
import WebVitalsContent from "./WebVitalsContent";

export const metadata: Metadata = {
  title: "Web Vitals | Thoughts",
  description:
    "Why I built a real-user vitals pipeline instead of just using Lighthouse — the collection stack, sendBeacon, P75, and what field data actually tells you.",
};

export default function WebVitalsThoughtsPage() {
  return <WebVitalsContent />;
}
