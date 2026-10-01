import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import { workPortfolioCounts, type CatalogCounts } from "@/lib/mfe/catalog";
import { workPortfolioRemote } from "@/lib/mfe/remotes";
import WorkPortfolioThoughtsContent from "./WorkPortfolioThoughtsContent";

/**
 * The counts come from the catalog, not from memory, and the catalog belongs
 * to the remote now: this page reads the catalog.json it publishes. Revalidated
 * daily, so a new demo in the remote shows up here without a deploy of this
 * site. If the fetch fails, the page renders without figures rather than stale
 * ones.
 */
const TITLE = "Work Portfolio | Thoughts";

const description = (counts: CatalogCounts | null) =>
  `Rebuilding ${counts ? `${counts.features} features from ${counts.projects} old jobs` : "features from old jobs"} as self-contained demos: reconstruction over emulation, anonymizing client work, a no-new-deps rule, the dual-ticker UX, and shipping it as merge-order-independent PRs.`;

export async function generateMetadata(): Promise<Metadata> {
  const counts = await workPortfolioCounts(workPortfolioRemote());
  return buildArticleMetadata({
    title: TITLE,
    description: description(counts),
    path: "/thoughts/work-portfolio",
  });
}

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default async function WorkPortfolioThoughtsPage() {
  const counts = await workPortfolioCounts(workPortfolioRemote());
  return <WorkPortfolioThoughtsContent counts={counts} />;
}
