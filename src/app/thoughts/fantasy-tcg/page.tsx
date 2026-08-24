import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import FantasyTcgContent from "./FantasyTcgContent";

const TITLE = "Fantasy TCG | Thoughts";
const DESCRIPTION =
  "How I turned real ESPN fantasy performances into rarity-tiered trading cards — a relative-rarity engine, a Zod-validated ESPN adapter, and why the economy is deferred.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/fantasy-tcg",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function FantasyTcgThoughtsPage() {
  return <FantasyTcgContent />;
}
