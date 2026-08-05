import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import UIRedesignContent from "./UIRedesignContent";

const TITLE = "UI Redesign | Thoughts";
const DESCRIPTION =
  "Why I swapped CSS keyframes for Framer Motion, moved Three.js to its own lab page, and chose a B&W + pastel + glassmorphism direction — and what's actually measurably better.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/ui-redesign",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function UIRedesignThoughtsPage() {
  return <UIRedesignContent />;
}
