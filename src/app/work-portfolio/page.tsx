import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import WorkPortfolioContent from "./WorkPortfolioContent";

const TITLE = "Work Portfolio";
const DESCRIPTION =
  "Interactive reconstructions of features shipped on past products: analytics dashboards, marketing tooling, onboarding flows, and more, rebuilt as self-contained demos.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/work-portfolio`,
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

// Static shell, demos are client-side. Cache at the CDN for a day.
export const revalidate = 86400;

export default function WorkPortfolioPage() {
  return <WorkPortfolioContent />;
}
