import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import ApiBackendOverhaulContent from "./ApiBackendOverhaulContent";

const TITLE = "API Backend Overhaul | Thoughts";
const DESCRIPTION =
  "Rebuilding portfolio_api into a typed, layered TypeScript backend across twelve phases, without breaking a single API contract paul-explore depends on.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/api-backend-overhaul",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function ApiBackendOverhaulThoughtsPage() {
  return <ApiBackendOverhaulContent />;
}
