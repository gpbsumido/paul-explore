import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import ErrorMessagesContent from "./ErrorMessagesContent";

const TITLE = "Errors People Can Read | Thoughts";
const DESCRIPTION =
  "A calendar create that failed after it worked, a toast that dumped a validation error on the screen, and what to check when an AI wrote the error handling: who wrote the string, what a retry would do, and whether anyone looked at the page.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/error-messages",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function ErrorMessagesThoughtsPage() {
  return <ErrorMessagesContent />;
}
