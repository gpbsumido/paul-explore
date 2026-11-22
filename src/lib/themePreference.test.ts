import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { THEME_STORAGE_KEY } from "./themePreference";

/**
 * The script in layout.tsx sets the theme before React loads, so it can't
 * import anything. It has to read the same key the provider writes, or a
 * returning visitor gets a flash of the wrong theme.
 */
describe("the theme storage key", () => {
  it("is the one the pre-paint script in layout.tsx reads", () => {
    const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(layout).not.toContain("'theme-preference'");
    expect(layout).toContain("THEME_STORAGE_KEY");
    expect(THEME_STORAGE_KEY).toBe("theme-preference");
  });
});
