import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import LandingContentV5 from "./v5/LandingContentV5";
import { pickTaglineIndex } from "./v5/taglines";
import { pickWriting } from "./v5/featured";

// Static, regenerated hourly. This page reads no session and renders no
// session-derived markup -- the header's log in/log out control resolves its
// own state client-side (see LandingActions). That is the durable fix for the
// Messenger auth bug: the old fix opted the whole route out of static
// rendering, which stopped the edge cache from serving a signed-in hub to
// guests by never caching at all, and paid a serverless render (and its TTFB)
// on every visit. Now there is nothing session-shaped in the HTML for a cache
// to leak, so it can be a CDN document. homePage.test.tsx pins this contract.
export const revalidate = 3600;

const TITLE = "Paul Sumido, Lead Frontend Developer";
const DESCRIPTION =
  "Lead front-end developer. Every claim on this site has a working app behind it, a write-up on the architecture that shaped it, and real Core Web Vitals you can check it against.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
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

/**
 * The landing page. Renders the current generation only. Every retired one, and
 * the ?version= switch between them, lives at /discover.
 *
 * The tagline and writing shortlist are baked at each ISR regeneration rather
 * than drawn per request -- they rotate hourly instead of per visit, which is
 * the price of the page being a static document.
 */
export default function Home() {
  const taglineIndex = pickTaglineIndex(Math.random);
  const writingPicks = pickWriting(Math.random);

  return (
    <LandingContentV5 taglineIndex={taglineIndex} writingPicks={writingPicks} />
  );
}
