import { describe, it, expect } from "vitest";
import { isAllowedEmail, parseAllowlist } from "./emailAllowlist";

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
