import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import TcgContent from "./TcgContent";

const TITLE = "TCG Pages | Thoughts";
const DESCRIPTION =
  "How and why the Pokemon TCG browser was built — API proxy architecture, server/client splits, pagination patterns, and trade-offs.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/tcg`,
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

export default function TcgPage() {
  return <TcgContent />;
}
