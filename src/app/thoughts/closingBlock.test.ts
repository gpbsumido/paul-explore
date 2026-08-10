import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Every write-up should end by saying where it stands.
 *
 * The sweep that added these found the real problem was not missing prose, it
 * was that a page written once and never revisited looked identical to one
 * that was current. The closing block forces the question: is this still what
 * I would do, what is wrong with it, and is anything actually queued.
 *
 * "Nothing scheduled" is a valid answer and several pages give it. What is not
 * valid is saying nothing at all.
 */
const THOUGHTS = join(process.cwd(), "src", "app", "thoughts");

const slugs = readdirSync(THOUGHTS).filter(
  (d) => d !== "_shared" && existsSync(join(THOUGHTS, d, "page.tsx")),
);

const sourceOf = (slug: string): string =>
  readdirSync(join(THOUGHTS, slug))
    .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"))
    .map((f) => readFileSync(join(THOUGHTS, slug, f), "utf-8"))
    .join("\n");

describe("write-ups say where they stand", () => {
  it("closes every write-up with a WhatsNext block", () => {
    const missing = slugs.filter((s) => !sourceOf(s).includes("WhatsNext"));
    expect(missing).toEqual([]);
  });

  it("covers every write-up on disk, not a subset", () => {
    expect(slugs.length).toBeGreaterThan(50);
  });
});
