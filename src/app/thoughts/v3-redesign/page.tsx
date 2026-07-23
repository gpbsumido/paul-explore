import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import V3RedesignContent from "./V3RedesignContent";

const TITLE = "V3 Redesign | Thoughts";
const DESCRIPTION =
  "The whole site as an interactive node graph: a hand-rolled force simulation, a fit-to-viewport renderer, the drag/hover bugs nobody warns you about, and an accessibility audit.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/v3-redesign`,
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

export default function V3RedesignThoughtsPage() {
  return <V3RedesignContent />;
}
