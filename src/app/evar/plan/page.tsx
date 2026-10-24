import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import PlanContent from "./PlanContent";

const TITLE = "The plan for EVAR Sizing";
const DESCRIPTION =
  "What EVAR Sizing is for, and what running it on its own domain would cost in Canadian dollars: storage, servers, a resident's time to set each scan's answers, the domain, and everything else, with sliders for any size.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/evar/plan`,
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

// The prices are a dated snapshot and the sliders run in the browser, so the page itself never changes.
export const revalidate = 86400;

export default function EvarPlanPage() {
  return <PlanContent />;
}
