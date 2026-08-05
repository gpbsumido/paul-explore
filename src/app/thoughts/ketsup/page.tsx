import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import KetsupContent from "./KetsupContent";

const TITLE = "Ketsup | Thoughts";
const DESCRIPTION =
  "Ketsup — a social app for image and text posts, think Instagram but simpler. Built and shipped at ketsup.paulsumido.com.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/ketsup",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function KetsupThoughtsPage() {
  return <KetsupContent />;
}
