import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import CodebaseAuditContent from "./CodebaseAuditContent";

const TITLE = "Thirteen Bugs That Looked Fine | Thoughts";
const DESCRIPTION =
  "An audit-only pass over the whole codebase turned up thirteen bugs, and nearly every one was a failure dressed up as a plausible result. How I ran it, the ones that cut across the site, and how I shipped the fixes as one stack.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/codebase-audit",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function CodebaseAuditPage() {
  return <CodebaseAuditContent />;
}
