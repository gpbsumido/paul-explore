import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import ImprovementsContent from "./ImprovementsContent";

const TITLE = "API Hardening | Thoughts";
const DESCRIPTION =
  "Five gaps closed: Zod validation, rate limiting, body size limits, URL param validation, and consistent error response shapes across all API routes.";

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
