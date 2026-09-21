import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import DesignDetoxContent from "./DesignDetoxContent";

const TITLE = "Design detox | Thoughts";
const DESCRIPTION =
  "Making the site read as designed, not generated: dropping the colored-stripe card tell, one editorial page intro, Apple squircle corners, the inline-arrow fix whose first attempt missed the real cause, a film grain that didn't help, and breaking the too-even grid into a bento.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/design-detox",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function DesignDetoxPage() {
  return <DesignDetoxContent />;
}
