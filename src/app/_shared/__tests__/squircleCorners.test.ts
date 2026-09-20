import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Apple-style continuous corners. corner-shape is progressive enhancement
// (Chromium-only in 2026, falls back to a normal rounded corner), so it's safe
// to apply broadly — the one hard rule is that circles and pills must be
// excluded, because squircle visibly distorts a corner whose radius is half the
// side. This guards both halves of that.
const css = readFileSync(
  join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

describe("squircle corners", () => {
  it("gives rounded utilities the squircle corner shape", () => {
    expect(css).toMatch(/corner-shape:\s*squircle/);
  });

  it("excludes fully-round elements so circles and pills stay round", () => {
    expect(css).toMatch(/:not\(\[class\*="rounded-full"\]\)/);
  });
});
