import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import E2eContent from "./E2eContent";

const TITLE = "End-to-End Testing | Thoughts";
const DESCRIPTION =
  "Why unit tests alone miss the flows that matter most, and how Playwright fills that gap — globalSetup auth, a dedicated test calendar, and three test suites for auth redirects, TCG browsing, and calendar CRUD.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/e2e",
});

export const revalidate = 86400;

export default function E2eThoughtsPage() {
  return <E2eContent />;
}
