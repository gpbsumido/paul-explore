import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import OperatorDashboardContent from "./OperatorDashboardContent";

const TITLE = "Operator Dashboard | Thoughts";
const DESCRIPTION =
  "Design decisions behind the smart micro-retail operator dashboard — tiered polling, optimistic updates, data freshness, severity-first sorting, and what we'd improve next.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/operator-dashboard`,
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

export default function OperatorDashboardThoughtsPage() {
  return <OperatorDashboardContent />;
}
