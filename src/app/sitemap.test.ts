import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";
import { SITE_URL } from "@/lib/site";
import { PATTERNS } from "@/lib/leetcode/patterns";
import { PUBLIC_ROUTES } from "@/lib/publicRoutes";

describe("sitemap", () => {
  it("lists every interview prep pattern page, which the static route list can't hold", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const pattern of PATTERNS) {
      expect(urls).toContain(`${SITE_URL}/learn/interview-prep/${pattern.id}`);
    }
  });

  it("lists each url once", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("lists every public route, with the home page as the bare site url", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const route of PUBLIC_ROUTES) {
      expect(urls).toContain(route === "/" ? SITE_URL : `${SITE_URL}${route}`);
    }
    expect(urls).not.toContain(`${SITE_URL}/`);
  });

  it("leaves out pages that sit behind a sign-in", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).not.toContain(`${SITE_URL}/to-do`);
    expect(urls).not.toContain(`${SITE_URL}/interviewee`);
  });

  it("does not invent dates or priorities", () => {
    for (const entry of sitemap()) {
      expect(Object.keys(entry)).toEqual(["url"]);
    }
  });
});
