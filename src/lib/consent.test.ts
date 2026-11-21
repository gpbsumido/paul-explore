import { describe, it, expect } from "vitest";
import {
  CONSENT_COOKIE,
  CONSENT_ACCEPTED,
  CONSENT_COOKIE_MAX_AGE,
  CONSENT_DECLINED,
  hasAcceptedConsent,
} from "@/lib/consent";

describe("hasAcceptedConsent", () => {
  it("is true only for the accepted value", () => {
    expect(hasAcceptedConsent(CONSENT_ACCEPTED)).toBe(true);
  });

  it("is false when the visitor declined", () => {
    expect(hasAcceptedConsent(CONSENT_DECLINED)).toBe(false);
  });

  it("is false when no choice has been made", () => {
    expect(hasAcceptedConsent(undefined)).toBe(false);
    expect(hasAcceptedConsent(null)).toBe(false);
    expect(hasAcceptedConsent("")).toBe(false);
  });

  it("does not accept a near-miss value", () => {
    expect(hasAcceptedConsent("Accepted")).toBe(false);
    expect(hasAcceptedConsent("true")).toBe(false);
  });
});

describe("consent cookie constants", () => {
  it("names the cookie and its two values", () => {
    expect(CONSENT_COOKIE).toBe("cookie_consent");
    expect(CONSENT_ACCEPTED).toBe("accepted");
    expect(CONSENT_DECLINED).toBe("declined");
  });

  it("remembers the choice for a year, in seconds", () => {
    expect(CONSENT_COOKIE_MAX_AGE).toBe(365 * 24 * 60 * 60);
  });
});
