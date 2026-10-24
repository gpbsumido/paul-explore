import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import GuideContent from "./GuideContent";

const TITLE = "How to measure for an EVAR";
const DESCRIPTION =
  "A step-by-step guide to sizing an endovascular aneurysm repair on CT: the top of the neck, its diameter and length, the sac, both common iliacs, sizing the graft from the maker's table, and what hospital planning adds.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/evar/guide`,
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

// Everything on the page is written out ahead of time, so it never changes between deploys.
export const revalidate = 86400;

export default function EvarGuidePage() {
  return <GuideContent />;
}
