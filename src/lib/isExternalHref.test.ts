import { describe, it, expect } from "vitest";
import { isExternalHref } from "./isExternalHref";

describe("isExternalHref", () => {
  it.each(["https://github.com/gpbsumido", "http://localhost:3001"])("treats %s as leaving the site", (href) => {
    expect(isExternalHref(href)).toBe(true);
  });

  it.each(["/world", "/thoughts/tcg#update-2026-08-30-catalog", "/auth/login", "#about"])(
    "keeps %s on the site",
    (href) => {
      expect(isExternalHref(href)).toBe(false);
    },
  );
});
