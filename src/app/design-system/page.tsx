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

// Fully static: the showcase is driven by a local catalog with no request-time
// data, so it's baked at build and served as a pure CDN document. This matters
// for a low-traffic page -- under plain ISR it gets evicted and the next visitor
// pays a cold regeneration of the whole tree in TTFB (which lands inside FCP);
// force-static removes that cold-render path entirely.
export const dynamic = "force-static";
export const revalidate = 86400;

export default function DesignSystemPage() {
  return <DesignSystemShowcaseContent />;
}
