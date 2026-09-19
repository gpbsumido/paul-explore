import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import SurpriseContent from "./SurpriseContent";

const TITLE = "Surprise";
const DESCRIPTION =
  "Spin for somewhere to land or browse the whole set. Every feature on the site in one place, including the ones the discover reel leaves out.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/surprise" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/surprise`,
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

// Static page -- the interactivity is all client-side, so cache it for a day.
export const revalidate = 86400;

export default function SurprisePage() {
  return <SurpriseContent />;
}
