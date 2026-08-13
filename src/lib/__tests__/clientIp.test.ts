import { describe, it, expect } from "vitest";
import { clientIp } from "@/lib/clientIp";

const req = (headers: Record<string, string>) =>
  ({ headers: new Headers(headers) }) as never;

describe("clientIp", () => {
  it("uses the address the trusted proxy observed, not the one the client sent", () => {
    // A client that sets its own X-Forwarded-For gets its value appended to
    // the left of the proxy's. Taking the leftmost entry would let a caller
    // pick their own rate-limit bucket on every request.
    expect(clientIp(req({ "x-forwarded-for": "1.1.1.1, 203.0.113.9" }))).toBe(
      "203.0.113.9",
    );
  });

  it("handles a spoofed chain of many entries", () => {
    expect(
      clientIp(req({ "x-forwarded-for": "9.9.9.9, 8.8.8.8, 7.7.7.7, 203.0.113.9" })),
    ).toBe("203.0.113.9");
  });

  it("uses the only entry when there is a single hop", () => {
    expect(clientIp(req({ "x-forwarded-for": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("tolerates padding and empty entries", () => {
    expect(clientIp(req({ "x-forwarded-for": " 1.1.1.1 , , 203.0.113.9 " }))).toBe(
      "203.0.113.9",
    );
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(req({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("returns a stable key when nothing identifies the caller", () => {
    expect(clientIp(req({}))).toBe("unknown");
  });
});
