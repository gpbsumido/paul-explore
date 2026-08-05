import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Every page should offer a way in or out of an account.
 *
 * `showLogout` defaults to true and the menu resolves the real session to show
 * "Log in" or "Log out", so switching it off hides the only account control on
 * that page. That is what issue #244 reported on the Gallery Wall. This guards
 * against it creeping back in.
 *
 * The one safe exception is a page that renders its own `AuthButton` — a
 * standalone log in / log out CTA — beside the menu. The v4 landing does exactly
 * that: the button is the prominent action, so the menu drops its redundant auth
 * row. A file that suppresses the menu's control AND has no AuthButton is still
 * an offender.
 */
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

describe("account control availability", () => {
  it("has no page suppressing the header's log in / log out control", () => {
    const offenders = walk(join(process.cwd(), "src", "app")).filter((file) => {
      const src = readFileSync(file, "utf8");
      return (
        src.includes("showLogout={false}") && !src.includes("AuthButton")
      );
    });
    expect(offenders.map((f) => f.split("/src/")[1])).toEqual([]);
  });
});
