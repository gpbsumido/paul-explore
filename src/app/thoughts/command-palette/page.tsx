import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import CommandPaletteThoughtsContent from "./CommandPaletteThoughtsContent";

const TITLE = "Command Palette | Thoughts";
const DESCRIPTION =
  "Building the site-wide command palette: one globally mounted instance, a registry built from the same FEATURES and THOUGHTS data the hub renders, a hand-rolled fuzzy matcher, and an ARIA combobox that stays keyboard and screen-reader honest.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/command-palette",
});

// Static write-up -- cache at CDN for 24h
export const revalidate = 86400;

export default function CommandPaletteThoughtsPage() {
  return <CommandPaletteThoughtsContent />;
}
