import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import BundleContent from "./BundleContent";

const TITLE = "Bundle Analysis | Thoughts";
const DESCRIPTION =
  "How running the bundle analyzer revealed Auth0Provider pulling jose, oauth4webapi, and openid-client into the browser bundle — and why removing it cost nothing.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/bundle",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function BundleThoughtsPage() {
  return <BundleContent />;
}
