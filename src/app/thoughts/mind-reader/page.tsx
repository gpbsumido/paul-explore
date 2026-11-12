import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import MindReaderThoughtsContent from "./MindReaderThoughtsContent";

const TITLE = "My first Svelte, inside a Next app | Thoughts";
const DESCRIPTION =
  "Learning Svelte 5 by building a party game: a two-player deduction game with over 200 roles, game rules kept in plain TypeScript, a ten-line loader to get a .svelte file through Turbopack, and the warnings and test timeouts that taught me the runes.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/mind-reader",
});

export const revalidate = 86400;

export default function MindReaderThoughtsPage() {
  return <MindReaderThoughtsContent />;
}
