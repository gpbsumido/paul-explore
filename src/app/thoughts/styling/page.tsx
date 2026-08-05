import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import StylingContent from "./StylingContent";

const TITLE = "Styling Decisions | Thoughts";
const DESCRIPTION =
  "How I set up design tokens, reusable components, and theming — told as a conversation.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/styling",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function StylingPage() {
  return <StylingContent />;
}
