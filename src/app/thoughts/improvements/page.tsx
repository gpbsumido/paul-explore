import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import ImprovementsContent from "./ImprovementsContent";

const TITLE = "API Hardening | Thoughts";
const DESCRIPTION =
  "Five gaps closed: Zod validation, rate limiting, body size limits, URL param validation, and consistent error response shapes across all API routes.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/improvements",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function ImprovementsPage() {
  return <ImprovementsContent />;
}
