import { describe, it, expect, vi, afterEach } from "vitest";
import { isAllowedEmail, isSiteAdmin, parseAllowlist } from "./emailAllowlist";

describe("parseAllowlist", () => {
  it("splits, trims, and lowercases a comma-separated list", () => {
    expect(parseAllowlist(" Ada@Example.com , grace@example.com ")).toEqual([
      "ada@example.com",
      "grace@example.com",
    ]);
  });

  it("treats unset or blank config as an empty list, not a wildcard", () => {
    expect(parseAllowlist(undefined)).toEqual([]);
    expect(parseAllowlist("")).toEqual([]);
    expect(parseAllowlist("  ,  ,")).toEqual([]);
  });
});

describe("isAllowedEmail", () => {
  const list = "ada@example.com,grace@example.com";

  it("admits a verified address on the list", () => {
    expect(
      isAllowedEmail({
        email: "ada@example.com",
        emailVerified: true,
        allowlist: list,
      }),
    ).toBe(true);
  });

  it("matches regardless of the casing or padding the provider sends", () => {
    expect(
      isAllowedEmail({
        email: "  ADA@Example.com ",
        emailVerified: true,
        allowlist: list,
      }),
    ).toBe(true);
  });

  it("rejects an unverified address even when it is on the list", () => {
    expect(
      isAllowedEmail({
        email: "ada@example.com",
        emailVerified: false,
        allowlist: list,
      }),
    ).toBe(false);
  });

  it("rejects an address that is not on the list", () => {
    expect(
      isAllowedEmail({
        email: "mallory@example.com",
        emailVerified: true,
        allowlist: list,
      }),
    ).toBe(false);
  });

  it("does not admit an address that merely contains an allowed one", () => {
    expect(
      isAllowedEmail({
        email: "xada@example.com",
        emailVerified: true,
        allowlist: list,
      }),
    ).toBe(false);
    expect(
      isAllowedEmail({
        email: "ada@example.com.evil.io",
        emailVerified: true,
        allowlist: list,
      }),
    ).toBe(false);
  });

  it("rejects everyone when the allowlist is unset, rather than opening up", () => {
    expect(
      isAllowedEmail({
        email: "ada@example.com",
        emailVerified: true,
        allowlist: undefined,
      }),
    ).toBe(false);
  });

  it("rejects a missing email claim", () => {
    expect(
      isAllowedEmail({
        email: undefined,
        emailVerified: true,
        allowlist: list,
      }),
    ).toBe(false);
  });
});

/**
 * Ten places asked "is this me?" by spelling out the same three fields against
 * FLAG_ADMIN_ALLOWED_EMAILS. They ask through one function now, so a page can't
 * forget the verification check or read a different list.
 */
describe("isSiteAdmin", () => {
  afterEach(() => vi.unstubAllEnvs());

  const sessionFor = (email: string, verified = true) => ({
    user: { email, email_verified: verified },
  });

  it("admits a verified address on the admin list", () => {
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "ada@example.com");
    expect(isSiteAdmin(sessionFor("Ada@Example.com"))).toBe(true);
  });

  it("refuses an address that isn't verified", () => {
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "ada@example.com");
    expect(isSiteAdmin(sessionFor("ada@example.com", false))).toBe(false);
  });

  it("refuses an address off the list", () => {
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "ada@example.com");
    expect(isSiteAdmin(sessionFor("grace@example.com"))).toBe(false);
  });

  it("refuses a signed-out visitor", () => {
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "ada@example.com");
    expect(isSiteAdmin(null)).toBe(false);
  });

  it("refuses everyone when the list is unset", () => {
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "");
    expect(isSiteAdmin(sessionFor("ada@example.com"))).toBe(false);
  });
});
