import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import CrawlersContent from "./CrawlersContent";

const TITLE = "Telling Crawlers What's Here | Thoughts";
const DESCRIPTION =
  "The five files a site is supposed to have and this one didn't: robots.txt, sitemap.xml, llms.txt, security.txt, and a web manifest — and the test that stops the sitemap going stale.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/crawlers",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function CrawlersPage() {
  return <CrawlersContent />;
}
