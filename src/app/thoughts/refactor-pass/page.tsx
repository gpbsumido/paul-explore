import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import RefactorPassContent from "./RefactorPassContent";

const TITLE = "A maintainability refactor pass | Thoughts";
const DESCRIPTION =
  "The refactor roadmap that follows the whole-project review: deduping against abstractions that already exist, the overfits I'm deliberately avoiding, and the order I'm shipping it in.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/refactor-pass",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function RefactorPassPage() {
  return <RefactorPassContent />;
}
