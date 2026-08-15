import { describe, it, expect } from "vitest";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { FEATURED, previewSrc } from "./featured";

/**
 * Each featured card fades a screenshot of its page into the corner on hover.
 * The images are shipped assets, one per theme, so a renamed pick or a missing
 * capture fails here instead of 404ing silently under a hover state nobody
 * checks. The size cap keeps a decorative flourish from becoming page weight.
 */
describe("featured hover previews", () => {
  const themes = ["light", "dark"] as const;

  it("ships both theme screenshots for every featured pick", () => {
    for (const pick of FEATURED) {
      for (const theme of themes) {
        const file = join(process.cwd(), "public", previewSrc(pick.id, theme));
        expect(existsSync(file), `${pick.id} ${theme} missing`).toBe(true);
      }
    }
  });

  it("keeps every preview under 120KB, since it renders at 30% opacity", () => {
    for (const pick of FEATURED) {
      for (const theme of themes) {
        const file = join(process.cwd(), "public", previewSrc(pick.id, theme));
        if (!existsSync(file)) continue;
        expect(statSync(file).size, `${pick.id} ${theme}`).toBeLessThan(
          120 * 1024,
        );
      }
    }
  });
});
