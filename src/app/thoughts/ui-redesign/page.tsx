import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import UIRedesignContent from "./UIRedesignContent";

const TITLE = "UI Redesign | Thoughts";
const DESCRIPTION =
  "Why I swapped CSS keyframes for Framer Motion, moved Three.js to its own lab page, and chose a B&W + pastel + glassmorphism direction — and what's actually measurably better.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/ui-redesign`,
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

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function UIRedesignThoughtsPage() {
  return <UIRedesignContent />;
}
