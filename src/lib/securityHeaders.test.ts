import { describe, it, expect } from "vitest";
import { securityHeaders } from "./securityHeaders";

const valueOf = (key: string): string =>
  securityHeaders().find((h) => h.key.toLowerCase() === key.toLowerCase())
    ?.value ?? "";

describe("securityHeaders", () => {
  it("stops browsers from MIME-sniffing a response into a different type", () => {
    expect(valueOf("X-Content-Type-Options")).toBe("nosniff");
  });

  it("keeps the full URL off cross-origin referers but sends the origin", () => {
    expect(valueOf("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("denies camera, microphone, and geolocation since nothing here uses them", () => {
    const policy = valueOf("Permissions-Policy");
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
    expect(policy).toContain("geolocation=()");
  });

  it("does not restate CSP-owned protections (framing, object-src)", () => {
    const keys = securityHeaders().map((h) => h.key.toLowerCase());
    expect(keys).not.toContain("x-frame-options");
    expect(keys).not.toContain("content-security-policy");
  });
});
