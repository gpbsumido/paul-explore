import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import RoutingContent from "./RoutingContent";

const TITLE = "Route Restructure | Thoughts";
const DESCRIPTION =
  "Why the authenticated hub moved from /protected to /, the force-static trade-off, and how security is maintained.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/routing",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function RoutingPage() {
  return <RoutingContent />;
}
