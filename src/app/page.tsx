import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE, SITE_DESCRIPTION } from "@/lib/site";
import LandingContentV7 from "./v7/LandingContentV7";

// Static, regenerated hourly. This page reads no session and renders no
// session-derived markup -- the header's log in/log out control resolves its
// own state client-side (see HeaderMenu). That is the durable fix for the
// Messenger auth bug: the old fix opted the whole route out of static
// rendering, which stopped the edge cache from serving a signed-in hub to
// guests by never caching at all, and paid a serverless render (and its TTFB)
// on every visit. Now there is nothing session-shaped in the HTML for a cache
// to leak, so it can be a CDN document. homePage.test.tsx pins this contract.
export const revalidate = 3600;

const TITLE = "Paul Sumido, Lead Frontend Developer";

export const metadata: Metadata = {
  title: TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

/**
 * The landing page. Renders the current generation only. Every retired one, and
 * the ?version= switch between them, lives at /discover.
 */
export default function Home() {
  return <LandingContentV7 />;
}
