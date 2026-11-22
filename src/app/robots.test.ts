import { describe, it, expect } from "vitest";
import robots from "./robots";
import { SESSION_PROTECTED_PREFIXES } from "@/lib/protectedPaths";

const disallowed = (): string[] => {
  const [rule] = [robots().rules].flat();
  return [rule.disallow ?? []].flat();
};

/**
 * A page behind a login hands a crawler a redirect and nothing else. robots.txt
 * listed two of them by hand and missed the five added after it, so every
 * protected prefix is read from the list the proxy enforces.
 */
describe("robots.txt", () => {
  it.each(SESSION_PROTECTED_PREFIXES)("tells crawlers to skip %s", (prefix) => {
    expect(disallowed()).toContain(prefix);
  });

  it.each(["/api/", "/dev/", "/auth/"])("still skips %s, which has nothing to index", (path) => {
    expect(disallowed()).toContain(path);
  });

  it("names each path once", () => {
    expect(new Set(disallowed()).size).toBe(disallowed().length);
  });
});
