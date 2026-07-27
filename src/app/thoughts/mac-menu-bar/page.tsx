import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import MacMenuBarContent from "./MacMenuBarContent";

const TITLE = "macOS Menu Bar | Thoughts";
const DESCRIPTION =
  "Turning a macOS desktop clone's static top-bar labels into a working, signal-driven menu system — a MenuBarService that derives every menu from window and dock state, real actions, and full keyboard a11y.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/mac-menu-bar`,
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

export default function MacMenuBarThoughtsPage() {
  return <MacMenuBarContent />;
}
