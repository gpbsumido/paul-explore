import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import ApiBackendOverhaulContent from "./ApiBackendOverhaulContent";

const TITLE = "API Backend Overhaul | Thoughts";
const DESCRIPTION =
  "Rebuilding portfolio_api into a typed, layered TypeScript backend across twelve phases, without breaking a single API contract paul-explore depends on.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/api-backend-overhaul`,
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

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function ApiBackendOverhaulThoughtsPage() {
  return <ApiBackendOverhaulContent />;
}
