"use client";

import { LinkPreview } from "@paul-portfolio/react";
import { previewSrc } from "../featured";

/**
 * The one figure on the page I don't control comes from real loads, so the link
 * to it raises a thumbnail of the live vitals page on hover, a peek before clicking through.
 *
 * The className lands on LinkPreview's wrapper span, but the package colours the
 * inner anchor itself, so the anchor is told to inherit or the dark colour never shows.
 */
export default function VitalsLink() {
  return (
    <LinkPreview
      href="/vitals"
      image={previewSrc("vitals", "light")}
      className="text-primary-700 underline underline-offset-4 hover:opacity-80 dark:text-primary-300 [&>a]:text-inherit"
    >
      Real Core Web Vitals from this domain, measured live
    </LinkPreview>
  );
}
