import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Every write-up should get its head tags from one helper.
 *
 * `world` was the only page hand-rolling them, and it had quietly drifted: its
 * Twitter card carried no image, so a share of it looked different from a share
 * of any other write-up. That is the failure mode of per-page metadata -- not
 * that it is wrong on day one, but that nothing keeps fifty copies in step.
 */
const THOUGHTS = join(process.cwd(), "src", "app", "thoughts");

const pages = readdirSync(THOUGHTS)
  .filter((d) => d !== "_shared")
  .map((d) => ({ slug: d, file: join(THOUGHTS, d, "page.tsx") }))
  .filter((p) => existsSync(p.file));

describe("write-up metadata", () => {
  it("comes from buildArticleMetadata on every page", () => {
    const handRolled = pages
      .filter(
        (p) => !readFileSync(p.file, "utf-8").includes("buildArticleMetadata"),
      )
      .map((p) => p.slug);
    expect(handRolled).toEqual([]);
  });

  it("sets a revalidate window on every page", () => {
    const missing = pages
      .filter(
        (p) =>
          !readFileSync(p.file, "utf-8").includes("export const revalidate"),
      )
      .map((p) => p.slug);
    expect(missing).toEqual([]);
  });

  it("found the pages it claims to be checking", () => {
    expect(pages.length).toBeGreaterThan(50);
  });
});
