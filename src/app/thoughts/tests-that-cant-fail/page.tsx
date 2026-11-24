import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import TestsThatCantFailContent from "./TestsThatCantFailContent";

const TITLE = "Tests That Can't Fail | Thoughts";
const DESCRIPTION =
  "I ran all 504 test files alone, in a random order, and judged every test on whether it would fail if the code broke. What a green suite was hiding, the patterns that held up and the ones that didn't, how a wrong check reads as proof, and what to verify when an AI wrote the tests or reported on them.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/tests-that-cant-fail",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function TestsThatCantFailThoughtsPage() {
  return <TestsThatCantFailContent />;
}
