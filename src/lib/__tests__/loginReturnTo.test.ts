import { describe, it, expect } from "vitest";
import { loginReturnToFromReferer } from "@/lib/loginReturnTo";

const ORIGIN = "https://paulsumido.com";

describe("loginReturnToFromReferer", () => {
  it("returns the path of a same-origin referer", () => {
    expect(loginReturnToFromReferer(`${ORIGIN}/calendar`, ORIGIN)).toBe(
      "/calendar",
    );
  });

  it("keeps the query string so filtered views round-trip", () => {
    expect(
      loginReturnToFromReferer(`${ORIGIN}/calendar?tab=week`, ORIGIN),
    ).toBe("/calendar?tab=week");
  });

  it("returns null for a cross-origin referer", () => {
    expect(loginReturnToFromReferer("https://evil.example/steal", ORIGIN)).toBe(
      null,
    );
  });

  it("returns null when the referer is itself an auth route", () => {
    expect(loginReturnToFromReferer(`${ORIGIN}/auth/login`, ORIGIN)).toBe(null);
  });

  it("returns null for a missing referer", () => {
    expect(loginReturnToFromReferer(null, ORIGIN)).toBe(null);
  });

  it("returns null for a garbage referer", () => {
    expect(loginReturnToFromReferer("not a url", ORIGIN)).toBe(null);
  });

  it("does not return the bare root (nothing worth redirecting to)", () => {
    expect(loginReturnToFromReferer(`${ORIGIN}/`, ORIGIN)).toBe(null);
  });
});
