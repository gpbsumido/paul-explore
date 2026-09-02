import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import UpdatesThoughtsContent from "./UpdatesThoughtsContent";

const TITLE = "A public changelog | Thoughts";
const DESCRIPTION =
  "Why the public Updates feed is a curated file rather than a parse of the internal changelog, why the search and sort logic is pure, and how a shipped ticket and the entry that closed it are kept in sync by a test.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/updates",
});

export const revalidate = 86400;

export default function UpdatesThoughtsPage() {
  return <UpdatesThoughtsContent />;
}
