import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import KetsupContent from "./KetsupContent";

const TITLE = "Ketsup | Thoughts";
const DESCRIPTION =
  "Ketsup — a social app for image and text posts, think Instagram but simpler. Built and shipped at ketsup.paulsumido.com.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/ketsup`,
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

export default function KetsupThoughtsPage() {
  return <KetsupContent />;
}
