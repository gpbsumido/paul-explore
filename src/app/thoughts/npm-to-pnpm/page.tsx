import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import NpmToPnpmContent from "./NpmToPnpmContent";

const TITLE = "npm to pnpm | Thoughts";
const DESCRIPTION =
  "Why we switched from npm to pnpm, what broke during the migration, and what pnpm's strict dependency resolution actually catches.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/npm-to-pnpm",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function NpmToPnpmThoughtsPage() {
  return <NpmToPnpmContent />;
}
