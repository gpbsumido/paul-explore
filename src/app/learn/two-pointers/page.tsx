import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import TwoPointersContent from "./TwoPointersContent";

const TITLE = "Two Pointers";
const DESCRIPTION =
  "Walk both ends toward the middle. Interactive demos for Two Sum on a sorted array and removing duplicates in-place.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/two-pointers`,
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

export default function TwoPointersPage() {
  return <TwoPointersContent />;
}
