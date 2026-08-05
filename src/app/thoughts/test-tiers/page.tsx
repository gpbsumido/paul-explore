import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import TestTiersContent from "./TestTiersContent";

const TITLE = "Tiered Testing Strategy | Thoughts";
const DESCRIPTION =
  "Why you shouldn't run every test on every commit: split tests by cost — fast unit tests per push, integration on merge, e2e nightly, flaky ones quarantined — grounded in this repo's ci.yml.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/test-tiers",
});

export const revalidate = 86400;

export default function TestTiersThoughtsPage() {
  return <TestTiersContent />;
}
