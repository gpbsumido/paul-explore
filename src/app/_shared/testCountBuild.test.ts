import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

/**
 * The landing's test figure is only honest if the count runs on every build.
 *
 * It used to hang off a `prebuild` script, and the pnpm this repo pins (8.5.1,
 * the only version I checked) doesn't run pre/post hooks unless told to. So `pnpm build` skipped it, every deploy
 * shipped whatever number was last committed, and production said 3,499 tests
 * while the suite had over 6,000. The count has to be part of `build` itself.
 */
const scripts = z
  .object({ scripts: z.record(z.string(), z.string()) })
  .parse(JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8")))
  .scripts;

describe("the build counts tests", () => {
  it("runs the counter before next build, as part of the build script", () => {
    const build = scripts.build;
    expect(build).toContain("node scripts/count-tests.mjs");
    expect(build.indexOf("count-tests")).toBeLessThan(build.indexOf("next build"));
  });

  it("doesn't leave a prebuild hook that pnpm would silently skip", () => {
    expect(scripts).not.toHaveProperty("prebuild");
  });
});
