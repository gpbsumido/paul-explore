import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import TcgContent from "./TcgContent";

const TITLE = "TCG Pages | Thoughts";
const DESCRIPTION =
  "How and why the Pokemon TCG browser was built — API proxy architecture, server/client splits, pagination patterns, and trade-offs.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/tcg",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function TcgPage() {
  return <TcgContent />;
}
