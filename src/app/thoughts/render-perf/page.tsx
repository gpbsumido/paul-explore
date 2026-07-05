import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import RenderPerfContent from "./RenderPerfContent";

const TITLE = "Render Performance | Thoughts";
const DESCRIPTION =
  "A systematic pass through runtime rendering costs: context value instability, resize handler allocation, backdrop-filter GPU pressure, unbounded DOM growth, and transition-all waste.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/render-perf`,
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

export default function RenderPerfThoughtsPage() {
  return <RenderPerfContent />;
}
