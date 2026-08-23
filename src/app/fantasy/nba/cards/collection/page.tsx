import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import CollectionContent from "./CollectionContent";

const TITLE = "My Collection | Card Lab";
const DESCRIPTION = "The Fantasy TCG cards you've pulled from packs.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/fantasy/nba/cards/collection`,
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

export default function CollectionPage() {
  return <CollectionContent />;
}
