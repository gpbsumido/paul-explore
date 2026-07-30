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
      promptCookie: undefined,
      ...partial,
    });

  it("adds nothing for a bare login with no referer and no prompt flag", () => {
    expect(additions({})).toEqual({});
  });

  it("adds a returnTo from a same-origin referer", () => {
    expect(additions({ referer: `${ORIGIN}/calendar` })).toEqual({
      returnTo: "/calendar",
    });
  });

  it("carries the prompt from the cookie (login, to re-ask who's logging in)", () => {
    expect(additions({ promptCookie: "login" })).toEqual({ prompt: "login" });
  });

  it("carries the prompt from the cookie (consent, to re-enter permissions)", () => {
    expect(additions({ promptCookie: "consent" })).toEqual({
      prompt: "consent",
    });
  });

  it("ignores a prompt cookie value that isn't allow-listed", () => {
    expect(additions({ promptCookie: "evil" })).toEqual({});
  });

  it("adds both a returnTo and the prompt", () => {
    expect(
      additions({ referer: `${ORIGIN}/calendar`, promptCookie: "consent" }),
    ).toEqual({ returnTo: "/calendar", prompt: "consent" });
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
        promptCookie: "login",
      }),
    ).toEqual({});
  });
});
