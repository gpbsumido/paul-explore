import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { THEME_STORAGE_KEY, buildPrePaintThemeScript } from "./themePreference";

/**
 * Runs the pre-paint script the way the browser does, as plain script text,
 * with the OS colour scheme stubbed. Returns the theme it put on <html>.
 */
function runPrePaintScript({
  savedPreference,
  osPrefersDark,
}: {
  savedPreference: string | null;
  osPrefersDark: boolean;
}): string | null {
  if (savedPreference === null) localStorage.removeItem(THEME_STORAGE_KEY);
  else localStorage.setItem(THEME_STORAGE_KEY, savedPreference);
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: osPrefersDark && query === "(prefers-color-scheme: dark)",
      media: query,
    })),
  );
  new Function(buildPrePaintThemeScript())();
  return document.documentElement.getAttribute("data-theme");
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

/**
 * The script in layout.tsx sets the theme before React loads, so it can't
 * import anything. It has to read the key the provider writes, and land on a
 * real theme whatever it finds there, or a returning visitor gets a flash of
 * the wrong theme, or no theme at all.
 */
describe("the pre-paint theme script", () => {
  it("applies a saved light or dark theme", () => {
    expect(runPrePaintScript({ savedPreference: "dark", osPrefersDark: false })).toBe("dark");
    expect(runPrePaintScript({ savedPreference: "light", osPrefersDark: true })).toBe("light");
  });

  it("follows the OS when the saved theme is system or missing", () => {
    expect(runPrePaintScript({ savedPreference: "system", osPrefersDark: true })).toBe("dark");
    expect(runPrePaintScript({ savedPreference: null, osPrefersDark: false })).toBe("light");
  });

  it("follows the OS when the saved theme is something it doesn't know", () => {
    expect(runPrePaintScript({ savedPreference: "blue", osPrefersDark: true })).toBe("dark");
    expect(runPrePaintScript({ savedPreference: "blue", osPrefersDark: false })).toBe("light");
  });

  it("is the script layout.tsx puts in the head", () => {
    const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(layout).toContain("buildPrePaintThemeScript()");
    expect(layout).not.toContain("localStorage");
  });
});
