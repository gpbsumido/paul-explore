import { describe, it, expect } from "vitest";
import {
  loginReturnToFromReferer,
  loginRedirectAdditions,
} from "@/lib/loginReturnTo";

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

describe("loginRedirectAdditions", () => {
  const additions = (
    partial: Partial<Parameters<typeof loginRedirectAdditions>[0]>,
  ) =>
    loginRedirectAdditions({
      searchParams: new URLSearchParams(),
      referer: null,
      origin: ORIGIN,
      reauthCookie: undefined,
      ...partial,
    });

  it("adds nothing for a bare login with no referer and no reauth flag", () => {
    expect(additions({})).toEqual({});
  });

  it("adds a returnTo from a same-origin referer", () => {
    expect(additions({ referer: `${ORIGIN}/calendar` })).toEqual({
      returnTo: "/calendar",
    });
  });

  it("forces a fresh login prompt when the reauth flag is set", () => {
    expect(additions({ reauthCookie: "1" })).toEqual({ prompt: "login" });
  });

  it("adds both a returnTo and the prompt after a denied consent", () => {
    expect(
      additions({ referer: `${ORIGIN}/calendar`, reauthCookie: "1" }),
    ).toEqual({ returnTo: "/calendar", prompt: "login" });
  });

  it("does not override a returnTo already on the request", () => {
    expect(
      additions({
        searchParams: new URLSearchParams("returnTo=/vitals"),
        referer: `${ORIGIN}/calendar`,
      }),
    ).toEqual({});
  });

  it("does not override a prompt already on the request", () => {
    expect(
      additions({
        searchParams: new URLSearchParams("prompt=none"),
        reauthCookie: "1",
      }),
    ).toEqual({});
  });
});
