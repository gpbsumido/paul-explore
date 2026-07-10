import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import AccessibilityContent from "./AccessibilityContent";

const TITLE = "Accessibility | Thoughts";
const DESCRIPTION =
  "Adding WCAG 2.1 AA compliance to a portfolio app — vitest-axe for unit-level scans, systematic component audits, and why automated tooling catches the easy stuff but not the hard stuff.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/accessibility`,
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

export default function AccessibilityThoughtsPage() {
  return <AccessibilityContent />;
}
