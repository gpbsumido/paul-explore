import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import SearchBarContent from "./SearchBarContent";

const TITLE = "Search Bar | Thoughts";
const DESCRIPTION =
  "Why and how the search bar was built — server/client split, filtering approach, and trade-offs.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/search-bar",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function SearchBarPage() {
  return <SearchBarContent />;
}
