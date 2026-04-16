import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import CiE2eContent from "./CiE2eContent";

const TITLE = "CI E2E Reliability | Thoughts";
const DESCRIPTION =
  "Two classes of CI failure: Auth0 crashing all middleware due to module-level initialization with empty secrets, and a search test that depended on an external API CI couldn't reach.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/ci-e2e`,
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

export default function CiE2eThoughtsPage() {
  return <CiE2eContent />;
}
