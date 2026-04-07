import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import E2eContent from "./E2eContent";

const TITLE = "End-to-End Testing | Thoughts";
const DESCRIPTION =
  "Why unit tests alone miss the flows that matter most, and how Playwright fills that gap — globalSetup auth, a dedicated test calendar, and three test suites for auth redirects, TCG browsing, and calendar CRUD.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/e2e`,
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

export const revalidate = 86400;

export default function E2eThoughtsPage() {
  return <E2eContent />;
}
