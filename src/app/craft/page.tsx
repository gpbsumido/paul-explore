import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import CraftContent from "./CraftContent";

const TITLE = "Craft";
const DESCRIPTION =
  "The traits of a lead front-end developer -- performance, system design, working with libraries, accessibility, testing, type safety, and more -- each backed by real work shipped in this project.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/craft`,
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

// Static page -- the craft matrix changes rarely, so cache it at the CDN for a day.
export const revalidate = 86400;

export default function CraftPage() {
  return <CraftContent />;
}
