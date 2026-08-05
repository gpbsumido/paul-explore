import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import OperatorDashboardContent from "./OperatorDashboardContent";

const TITLE = "Operator Dashboard | Thoughts";
const DESCRIPTION =
  "Design decisions behind the smart micro-retail operator dashboard — tiered polling, optimistic updates, data freshness, severity-first sorting, and what we'd improve next.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/operator-dashboard",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function OperatorDashboardThoughtsPage() {
  return <OperatorDashboardContent />;
}
