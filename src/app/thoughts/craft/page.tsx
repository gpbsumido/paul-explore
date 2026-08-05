import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import CraftThoughtsContent from "./CraftThoughtsContent";

const TITLE = "Craft | Thoughts";
const DESCRIPTION =
  "Building the Craft page: naming the traits of a lead front-end developer and backing each one with real work in this project, plus the data-integrity test that fails on a dead evidence link.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/craft",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function CraftThoughtsPage() {
  return <CraftThoughtsContent />;
}
