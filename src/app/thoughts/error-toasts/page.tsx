import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import ErrorToastsContent from "./ErrorToastsContent";

const TITLE = "Error Toasts | Thoughts";
const DESCRIPTION =
  "Catching every failed write at one layer: a React Query MutationCache onError that raises a toast app-wide, an imperative toast() built in the design system so it works outside React, an SSR-safe portal, and an accessible live region.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/error-toasts",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function ErrorToastsThoughtsPage() {
  return <ErrorToastsContent />;
}
