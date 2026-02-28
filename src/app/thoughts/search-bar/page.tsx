import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import SearchBarContent from "./SearchBarContent";

const TITLE = "Search Bar | Thoughts";
const DESCRIPTION =
  "Why and how the search bar was built — server/client split, filtering approach, and trade-offs.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/search-bar`,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function SearchBarPage() {
  return <SearchBarContent />;
}
