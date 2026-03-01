import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import SecurityContent from "./SecurityContent";

const TITLE = "CSP & Security | Thoughts";
const DESCRIPTION =
  "Why landing page sections went blank in production — CSP nonces, strict-dynamic, Next.js static pages, and the tradeoff between 'unsafe-inline' and making the root layout async.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/security`,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function SecurityThoughtsPage() {
  return <SecurityContent />;
}
