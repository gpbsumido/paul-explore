import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const demo = readFileSync(
  join(process.cwd(), "src/app/work-portfolio/demos/this-site.tsx"),
  "utf8",
);
const thumbsDir = join(process.cwd(), "public/work-portfolio/thumbs");

describe("this-site demo thumbnails", () => {
  it("shows a theme-matched screenshot for each link (light and dark)", () => {
    expect(demo).toMatch(/-light\.png/);
    expect(demo).toMatch(/dark:hidden/);
    expect(demo).toMatch(/dark:block/);
  });

  it("ships a light thumbnail beside every dark one", () => {
    const files = readdirSync(thumbsDir).filter((f) => f.endsWith(".png"));
    const dark = files.filter((f) => !f.endsWith("-light.png"));
    const missing = dark.filter(
      (f) => !files.includes(f.replace(/\.png$/, "-light.png")),
    );
    expect(missing).toEqual([]);
  });
});
