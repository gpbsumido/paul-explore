import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import ThoughtsIndexContent from "./ThoughtsIndexContent";

const TITLE = "Thoughts";
const DESCRIPTION =
  "Dev-notes write-ups on the architecture decisions, trade-offs, and lessons behind this project.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/thoughts`,
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

export const revalidate = 86400;

export default function ThoughtsIndexPage() {
  return <ThoughtsIndexContent />;
}
