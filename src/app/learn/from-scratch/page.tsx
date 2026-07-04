import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import FromScratchContent from "./FromScratchContent";

const TITLE = "From Scratch";
const DESCRIPTION =
  "Implement once(), pipe(), Promise.all(), bind(), and Array.map() from scratch. Guided line-by-line walkthroughs with inline annotations and test runners.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/from-scratch`,
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

export default function FromScratchPage() {
  return <FromScratchContent />;
}
