import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import DesignSystemChartsContent from "./DesignSystemChartsContent";

const TITLE = "Framework-Agnostic Charts | Thoughts";
const DESCRIPTION =
  "Rebuilding this app's recharts and unovis charts as pure SVG computed from one dependency-free geometry core, so React and Angular render identical output — Sparkline, BarChart, DonutChart, a token-driven palette, and role=img accessibility.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/design-system-charts`,
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

export default function DesignSystemChartsPage() {
  return <DesignSystemChartsContent />;
}
