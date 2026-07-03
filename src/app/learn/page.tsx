import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import LearnHub from "./LearnHub";

const TITLE = "Learn";
const DESCRIPTION =
  "Interactive deep-dives into algorithms and frontend patterns. Build real understanding through demos, not memorized templates.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn`,
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

export default function LearnPage() {
  return <LearnHub />;
}
