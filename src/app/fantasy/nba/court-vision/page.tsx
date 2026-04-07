import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import CourtVisionContent from "./CourtVisionContent";

const TITLE = "Court Vision";
const DESCRIPTION =
  "Basketball half-court shot chart with color-coded shooting zones by player.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/fantasy/nba/court-vision`,
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

// SVG shot chart data is static — cache the shell for an hour
export const revalidate = 3600;

export default function CourtVisionPage() {
  return <CourtVisionContent />;
}
