import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import SecurityContent from "./SecurityContent";

const TITLE = "CSP & Security | Thoughts";
const DESCRIPTION =
  "Why landing page sections went blank in production — CSP nonces, strict-dynamic, Next.js static pages, and the tradeoff between 'unsafe-inline' and making the root layout async.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/security",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function SecurityThoughtsPage() {
  return <SecurityContent />;
}
