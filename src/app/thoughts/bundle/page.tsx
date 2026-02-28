import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import BundleContent from "./BundleContent";

const TITLE = "Bundle Analysis | Thoughts";
const DESCRIPTION =
  "How running the bundle analyzer revealed Auth0Provider pulling jose, oauth4webapi, and openid-client into the browser bundle — and why removing it cost nothing.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/bundle`,
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

export default function BundleThoughtsPage() {
  return <BundleContent />;
}
