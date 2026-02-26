import type { Metadata } from "next";
import dynamic from "next/dynamic";
import ThoughtsSkeleton from "@/components/ThoughtsSkeleton";

export const metadata: Metadata = {
  title: "Search Bar | Thoughts",
  description:
    "Why and how the search bar was built — server/client split, filtering approach, and trade-offs.",
};

// Lazy-load — SearchBarContent imports a live SearchDemo that includes
// the full ThreadList logic, so it earns a separate chunk.
const SearchBarContent = dynamic(() => import("./SearchBarContent"), {
  loading: () => <ThoughtsSkeleton />,
});

export default function SearchBarPage() {
  return <SearchBarContent />;
}
