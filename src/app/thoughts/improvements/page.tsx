import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import ImprovementsContent from "./ImprovementsContent";

const TITLE = "API Hardening | Thoughts";
const DESCRIPTION =
  "Closing three P0 gaps: Zod runtime validation on every API route, a fixed-window rate limiter on open endpoints, and body size limits on every route that reads a request body.";

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
