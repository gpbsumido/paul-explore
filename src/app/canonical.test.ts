import { describe, it, expect, vi } from "vitest";

vi.mock("next/font/google", () => {
  const font = () => ({ variable: "", className: "" });
  return { Geist: font, Geist_Mono: font, Bricolage_Grotesque: font };
});

/**
 * Next merges metadata shallowly from the root layout down, and a page that
 * sets no `alternates` keeps its parent's. A canonical on the root layout is
 * therefore inherited by every page that doesn't override it, which told
 * search engines every write-up was a duplicate of the homepage.
 */
describe("canonical URLs", () => {
  it("the root layout sets no canonical for pages to inherit", async () => {
    const { metadata } = await import("./layout");
    expect(metadata.alternates?.canonical).toBeUndefined();
  });

  it("the root layout sets no og:url for pages to inherit", async () => {
    // Same shallow merge: a page with no openGraph of its own kept the root's
    // url, so a shared link to it previewed as the homepage.
    const { metadata } = await import("./layout");
    expect(metadata.openGraph).not.toHaveProperty("url");
  });

  it("the homepage declares itself canonical", async () => {
    const { metadata } = await import("./page");
    expect(metadata.alternates?.canonical).toBe("/");
  });
});
