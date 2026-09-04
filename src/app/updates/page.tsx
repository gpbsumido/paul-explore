import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import UpdatesContent from "./UpdatesContent";

const TITLE = "Updates";
const DESCRIPTION =
  "A public, plain-language changelog for this project: what shipped and why, searchable and filterable, with a link to suggest what comes next.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/updates`,
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

// Static page — the entries are curated data that changes on release, so cache
// it at the CDN for a day.
export const revalidate = 86400;

export default function UpdatesPage() {
  return <UpdatesContent />;
}
