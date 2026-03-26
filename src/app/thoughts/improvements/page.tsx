import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import ImprovementsContent from "./ImprovementsContent";

const TITLE = "Validation & Rate Limiting | Thoughts";
const DESCRIPTION =
  "Closing two P0 gaps: Zod runtime validation on every API route and request body, and a fixed-window rate limiter on open endpoints in the proxy middleware.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/improvements`,
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

export default function ImprovementsPage() {
  return <ImprovementsContent />;
}
