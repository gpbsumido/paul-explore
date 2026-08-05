import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import TestingContent from "./TestingContent";

const TITLE = "Testing | Thoughts";
const DESCRIPTION =
  "How 640+ tests (unit + e2e) got added to a codebase with zero — the setup, what got tested and why, and the MSW delay() trick for proving optimistic updates actually work.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/testing",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function TestingThoughtsPage() {
  return <TestingContent />;
}
