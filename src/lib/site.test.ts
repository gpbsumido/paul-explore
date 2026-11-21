import { describe, it, expect, vi, afterEach } from "vitest";
import { buildArticleMetadata, SITE_URL, OG_IMAGE } from "./site";

const base = {
  title: "Performance Improvements | Thoughts",
  description: "A systematic pass through each Core Web Vital.",
  path: "/thoughts/perf",
};

describe("buildArticleMetadata", () => {
  it("passes the title and description straight through", () => {
    const meta = buildArticleMetadata(base);
    expect(meta.title).toBe(base.title);
    expect(meta.description).toBe(base.description);
  });

  it("builds the canonical og:url from SITE_URL and the path", () => {
    const meta = buildArticleMetadata(base);
    expect(meta.openGraph?.url).toBe(`${SITE_URL}${base.path}`);
  });

  it("declares the page's own path as its canonical URL", () => {
    const meta = buildArticleMetadata(base);
    expect(meta.alternates?.canonical).toBe(base.path);
  });

  it("defaults the open-graph type to article", () => {
    const meta = buildArticleMetadata(base);
    expect(meta.openGraph?.type).toBe("article");
  });

  it("lets a page override the open-graph type (learn pages use website)", () => {
    const meta = buildArticleMetadata({ ...base, ogType: "website" });
    expect(meta.openGraph?.type).toBe("website");
  });

  it("mirrors title and description into the open-graph block", () => {
    const meta = buildArticleMetadata(base);
    expect(meta.openGraph?.title).toBe(base.title);
    expect(meta.openGraph?.description).toBe(base.description);
  });

  it("wires the shared OG image into open-graph and twitter", () => {
    const meta = buildArticleMetadata(base);
    expect(meta.openGraph?.images).toEqual([OG_IMAGE]);
    expect(meta.twitter?.images).toEqual([OG_IMAGE.url]);
  });

  it("sets the twitter summary-large-image card with matching copy", () => {
    const meta = buildArticleMetadata(base);
    expect(meta.twitter?.card).toBe("summary_large_image");
    expect(meta.twitter?.title).toBe(base.title);
    expect(meta.twitter?.description).toBe(base.description);
  });
});

describe("SITE_URL", () => {
  afterEach(() => vi.unstubAllEnvs());

  /** SITE_URL is read once when the module loads, so each case loads a fresh copy. */
  async function siteUrlWith(env: string | undefined): Promise<string> {
    if (env === undefined) vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    else vi.stubEnv("NEXT_PUBLIC_SITE_URL", env);
    vi.resetModules();
    return (await import("./site")).SITE_URL;
  }

  it("follows NEXT_PUBLIC_SITE_URL when a deploy sets it", async () => {
    expect(await siteUrlWith("https://staging.example.com")).toBe("https://staging.example.com");
  });

  it("falls back to the production site when it isn't set", async () => {
    expect(await siteUrlWith(undefined)).toBe("https://paulsumido.com");
  });
});
