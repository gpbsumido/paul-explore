import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import MessengerAuthContent from "./MessengerAuthContent";

const TITLE = "Messenger Auth Bug | Thoughts";
const DESCRIPTION =
  "Why links opened in Facebook Messenger showed a logged-in hub for users who were not authenticated — two root causes, two fixes.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/messenger-auth",
});

export const revalidate = 86400;

export default function MessengerAuthPage() {
  return <MessengerAuthContent />;
}
