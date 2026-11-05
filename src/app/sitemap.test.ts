import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";
import { SITE_URL } from "@/lib/site";
import { PATTERNS } from "@/lib/leetcode/patterns";

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
});
