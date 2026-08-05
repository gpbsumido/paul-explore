import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import FeatureFlagsContent from "./FeatureFlagsContent";

const TITLE = "Feature Flags | Thoughts";
const DESCRIPTION =
  "Design decisions behind the feature-flag console — an engine-first build with deterministic FNV-1a bucketing, sticky and monotonic rollouts, first-match targeting, an explainable evaluation reason, and an audit log.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/feature-flags",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function FeatureFlagsThoughtsPage() {
  return <FeatureFlagsContent />;
}
