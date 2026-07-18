import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import DeploymentContent from "./DeploymentContent";

const TITLE = "Deployment | Thoughts";
const DESCRIPTION =
  "How a senior developer thinks about shipping to production: deployment as five separate jobs, choosing a platform from the app's runtime shape, when to decide, the trade-offs that actually bite, what the industry defaults to, and the concrete Vercel + Cloudflare setup behind this portfolio.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/deployment`,
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

export default function DeploymentThoughtsPage() {
  return <DeploymentContent />;
}
