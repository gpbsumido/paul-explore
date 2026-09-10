import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import AppleDesignContent from "./AppleDesignContent";

const TITLE = "Apple Design | Thoughts";
const DESCRIPTION =
  "Auditing the whole app against Apple's fluid-interface principles and fixing the gaps: the accessibility settings a glass-heavy UI was ignoring (reduced transparency, contrast, eased theme change), press-down feedback, a critically-damped modal, menus that spring from their trigger, and size-specific typography.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/apple-design",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function AppleDesignThoughtsPage() {
  return <AppleDesignContent />;
}
