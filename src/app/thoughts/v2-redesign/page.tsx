import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import V2RedesignContent from "./V2RedesignContent";

const TITLE = "V2 Redesign | Thoughts";
const DESCRIPTION =
  "URL-based version routing with next/dynamic bundle splitting — how ?version=v1 keeps Three.js out of the default path while v2 ships a clean slate.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/v2-redesign`,
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

export default function V2RedesignThoughtsPage() {
  return <V2RedesignContent />;
}
