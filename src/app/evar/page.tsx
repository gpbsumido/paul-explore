import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import EvarContent from "./EvarContent";
import EvarEntry from "./EvarEntry";
import { loadInitialScans } from "@/lib/evar/initialScans";

const TITLE = "EVAR Sizing";
const DESCRIPTION =
  "Practise sizing an endovascular aneurysm repair on synthetic and real abdominal CT: measure the proximal neck, the sac and both common iliacs with calipers, then check each number against the reference.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/evar`,
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

// Phantoms are drawn and real scans fetched in the browser, so the page itself never changes.
export const revalidate = 86400;

/** Reads the real scans on the server, so the first render can open on one, behind the welcome page for a first visit. */
export default async function EvarPage() {
  return (
    <EvarEntry>
      <EvarContent initialScans={await loadInitialScans()} />
    </EvarEntry>
  );
}
