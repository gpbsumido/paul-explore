import { describe, it, expect } from "vitest";
import {
  loginReturnToFromReferer,
  loginRedirectAdditions,
  SESSION_TIMEOUT_PROMPT,
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

  it.each([
    ["a look-alike host", "https://paulsumido.com.evil.example/calendar"],
    ["a host with ours as a prefix of the user part", "https://paulsumido.com@evil.example/calendar"],
    ["plain http", "http://paulsumido.com/calendar"],
    ["another port", "https://paulsumido.com:8443/calendar"],
  ])("returns null for %s", (_label, referer) => {
    expect(loginReturnToFromReferer(referer, ORIGIN)).toBeNull();
  });

  it("keeps a page whose path merely starts with the letters 'auth'", () => {
    expect(loginReturnToFromReferer(`${ORIGIN}/authors/paul`, ORIGIN)).toBe("/authors/paul");
  });

  it("drops every auth route, not only login", () => {
    expect(loginReturnToFromReferer(`${ORIGIN}/auth/callback?code=x`, ORIGIN)).toBeNull();
    expect(loginReturnToFromReferer(`${ORIGIN}/auth/logout`, ORIGIN)).toBeNull();
  });

  // Known bug: A same-origin referer like https://paulsumido.com//evil.example/x has the
  // pathname "//evil.example/x", which a browser reads as a protocol-relative
  // URL. The Auth0 SDK sanitizes returnTo before redirecting, so nothing is
  // exploitable today, but this function is the layer that says it only hands
  // back same-origin paths. Recorded as a finding.
  it.fails("never hands back a protocol-relative path", () => {
    expect(
      loginReturnToFromReferer(`${ORIGIN}//evil.example/x`, ORIGIN),
    ).not.toMatch(/^\/\//);
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

  it("carries the prompt from the cookie (select_account, to pick another account)", () => {
    expect(additions({ promptCookie: "select_account" })).toEqual({
      prompt: "select_account",
    });
  });

  it.each(["evil", "none", "LOGIN", "login consent", ""])(
    "ignores the prompt cookie value %j",
    (promptCookie) => {
      expect(additions({ promptCookie })).toEqual({});
    },
  );

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

describe("session timeout prompt", () => {
  it("forces a prompt that re-authenticates rather than one that re-consents", () => {
    // prompt=consent re-asks for scope approval; per OIDC Core it explicitly
    // does not re-authenticate. Auth0 sees its own still-valid SSO cookie,
    // silently reissues for the same user, and for a first-party client skips
    // the screen entirely -- so a timed-out session lands straight back in as
    // whoever it already was.
    expect(SESSION_TIMEOUT_PROMPT).toBe("login");
  });

  it("is a prompt the proxy is willing to forward", () => {
    const additions = loginRedirectAdditions({
      searchParams: new URLSearchParams(),
      referer: null,
      origin: ORIGIN,
      promptCookie: SESSION_TIMEOUT_PROMPT,
    });
    expect(additions.prompt).toBe(SESSION_TIMEOUT_PROMPT);
  });
});
