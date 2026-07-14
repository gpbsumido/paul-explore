import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import DesignSystemContent from "./DesignSystemContent";

const TITLE = "Shared Design System | Thoughts";
const DESCRIPTION =
  "Extracting a shared design system from one app and wiring it into two — CSS custom properties as the canonical token format, thin framework wrappers, and the publish-to-npm workflow.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/design-system`,
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

export default function DesignSystemPage() {
  return <DesignSystemContent />;
}
