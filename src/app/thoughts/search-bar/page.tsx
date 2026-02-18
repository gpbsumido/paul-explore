import type { Metadata } from "next";
import SearchBarContent from "./SearchBarContent";

export const metadata: Metadata = {
  title: "Search Bar | Thoughts",
  description:
    "Why and how the search bar was built — server/client split, filtering approach, and trade-offs.",
};

export default function SearchBarPage() {
  return <SearchBarContent />;
}
