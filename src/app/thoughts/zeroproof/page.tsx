import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import ZeroproofContent from "./ZeroproofContent";

const TITLE = "Building a No-Loss Sportsbook, Ledger First | Thoughts";
const DESCRIPTION =
  "A betting product where the record is real and the dollars are fake: a double-entry ledger from the first row, closing-line value captured on every bet, and seven stacked pull requests that each deploy on their own.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/zeroproof",
});

export const revalidate = 86400;

export default function ZeroproofPage() {
  return <ZeroproofContent />;
}
