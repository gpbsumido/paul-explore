import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import NpmToPnpmContent from "./NpmToPnpmContent";

const TITLE = "npm to pnpm | Thoughts";
const DESCRIPTION =
  "Why we switched from npm to pnpm, what broke during the migration, and what pnpm's strict dependency resolution actually catches.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/npm-to-pnpm`,
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

export default function NpmToPnpmThoughtsPage() {
  return <NpmToPnpmContent />;
}
