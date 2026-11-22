import { describe, it, expect, vi } from "vitest";
import { SITE_DESCRIPTION, OG_IMAGE } from "./site";
import manifest from "@/app/manifest";

vi.mock("next/font/google", () => {
  const font = () => ({ variable: "", className: "" });
  return { Geist: font, Geist_Mono: font, Bricolage_Grotesque: font };
});

/**
 * The landing is about lead front-end work now, and the manifest and the root
 * layout's fallback still led with NBA stats and a TCG browser. One constant
 * feeds all three, so the next rewrite of the pitch can't miss one.
 */
describe("the site description", () => {
  it("leads with the front-end lead work, not the old app list", () => {
    expect(SITE_DESCRIPTION).toMatch(/^Lead front-end developer\./);
    expect(SITE_DESCRIPTION).not.toMatch(/NBA|Pokémon|TCG/);
  });

  it("is what the web app manifest installs with", () => {
    expect(manifest().description).toBe(SITE_DESCRIPTION);
  });

  it("is the root layout's fallback and the home page's own description", async () => {
    const [{ metadata: rootMetadata }, { metadata: homeMetadata }] = await Promise.all([
      import("@/app/layout"),
      import("@/app/page"),
    ]);
    expect(rootMetadata.description).toBe(SITE_DESCRIPTION);
    expect(homeMetadata.description).toBe(SITE_DESCRIPTION);
  });

  it("is what a shared link to the home page previews with", async () => {
    const { metadata } = await import("@/app/page");
    expect(metadata.openGraph?.description).toBe(SITE_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(SITE_DESCRIPTION);
  });

  it("gives the share image an alt that matches the pitch", () => {
    expect(OG_IMAGE.alt).not.toMatch(/playground/i);
    expect(OG_IMAGE.alt).toMatch(/front-end/i);
  });

  it("is the alt the share image itself exports, so the two can't drift", async () => {
    const { alt } = await import("@/app/opengraph-image");
    expect(alt).toBe(OG_IMAGE.alt);
  });
});
