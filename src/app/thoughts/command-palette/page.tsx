import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import CommandPaletteThoughtsContent from "./CommandPaletteThoughtsContent";

const TITLE = "Command Palette | Thoughts";
const DESCRIPTION =
  "Building the site-wide command palette: one globally mounted instance, a registry built from the same FEATURES and THOUGHTS data the hub renders, a hand-rolled fuzzy matcher, and an ARIA combobox that stays keyboard and screen-reader honest.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/command-palette`,
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

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function CommandPaletteThoughtsPage() {
  return <CommandPaletteThoughtsContent />;
}
