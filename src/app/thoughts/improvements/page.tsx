import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import ImprovementsContent from "./ImprovementsContent";

const TITLE = "API Hardening | Thoughts";
const DESCRIPTION =
  "Closing four gaps: Zod runtime validation on every API route, a fixed-window rate limiter on open endpoints, body size limits on every route that reads a request body, and validation on dynamic route params and query strings.";

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
