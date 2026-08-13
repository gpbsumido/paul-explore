import type { MetadataRoute } from "next";

/**
 * Web app manifest.
 *
 * The icons already existed as icon.tsx and apple-icon.tsx; without a manifest
 * the browser had no name, colours, or start URL to install the site with, so
 * "Add to Home Screen" produced an untitled shortcut.
 *
 * `display: "browser"` rather than "standalone" on purpose. Standalone strips
 * the address bar, and this site is a set of linked pages people are meant to
 * navigate and share — taking away back, forward, and the URL would make it
 * worse, not more app-like.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Paul Sumido",
    short_name: "paul-explore",
    description:
      "Personal playground and portfolio — NBA stats, fantasy league history, Pokémon TCG browser, and write-ups on how it was built.",
    start_url: "/",
    display: "browser",
    // Matches the light-theme background token, so the splash and theme colour
    // do not flash a colour that appears nowhere in the design.
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
