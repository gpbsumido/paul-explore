import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import DesignSystemShowcaseContent from "./DesignSystemShowcaseContent";

const TITLE = "Design System";
const DESCRIPTION =
  "An interactive, Storybook-style gallery of the shared @paul-portfolio design system — every primitive rendered live, an accessible props playground, design tokens, and links to the pages each component ships on.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/design-system`,
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

// Static showcase driven by the local catalog -- cache at the CDN for 24h.
export const revalidate = 86400;

export default function DesignSystemPage() {
  return <DesignSystemShowcaseContent />;
}
