import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import ResultsHistoryContent from "./ResultsHistoryContent";

const TITLE = "Your EVAR results";
const DESCRIPTION =
  "Every EVAR sizing case finished in this browser: measurements within tolerance over time, averages and bests by level, and each attempt.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/evar/results`,
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

// The history lives in the browser, so the page itself never changes.
export const revalidate = 86400;

export default function EvarResultsPage() {
  return <ResultsHistoryContent />;
}
