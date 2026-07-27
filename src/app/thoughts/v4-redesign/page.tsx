import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import V4RedesignContent from "./V4RedesignContent";

const TITLE = "V4 Redesign | Thoughts";
const DESCRIPTION =
  "The landing and hub as a slot machine: three dependent reels derived from the same data as the graph, a decelerating spin with a reduced-motion path, and a listbox-based accessibility model.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/v4-redesign`,
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

export const revalidate = 86400;

export default function V4RedesignThoughtsPage() {
  return <V4RedesignContent />;
}
