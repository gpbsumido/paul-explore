import { describe, it, expect } from "vitest";
import { buildCsp, toOrigin } from "./csp";

const directive = (csp: string, name: string): string =>
  csp.split("; ").find((d) => d.startsWith(`${name} `)) ?? "";

describe("toOrigin", () => {
  it("reduces a media URL to a bare origin", () => {
    expect(toOrigin("https://d123.cloudfront.net/")).toBe("https://d123.cloudfront.net");
    expect(toOrigin("https://bucket.s3.ca-central-1.amazonaws.com/gallery-walls")).toBe(
      "https://bucket.s3.ca-central-1.amazonaws.com",
    );
  });

  it("treats unset, blank, or malformed values as absent", () => {
    expect(toOrigin(undefined)).toBeNull();
    expect(toOrigin("   ")).toBeNull();
    expect(toOrigin("not a url")).toBeNull();
  });
});

describe("buildCsp", () => {
  it("allows photos from the media origin so saved walls can render", () => {
    const csp = buildCsp("https://d123.cloudfront.net");
    expect(directive(csp, "img-src")).toContain("https://d123.cloudfront.net");
  });

  it("keeps the existing image origins when a media origin is added", () => {
    const csp = buildCsp("https://d123.cloudfront.net");
    const img = directive(csp, "img-src");
    expect(img).toContain("'self'");
    expect(img).toContain("blob:");
    expect(img).toContain("data:");
    expect(img).toContain("https://assets.tcgdex.net");
  });

  it("leaves the policy alone when no media origin is configured", () => {
    const img = directive(buildCsp(undefined), "img-src");
    expect(img).toBe(
      "img-src 'self' blob: data: https://assets.tcgdex.net https://raw.githubusercontent.com https://a.espncdn.com https://explorer-api.walletconnect.com",
    );
  });

  it("still locks down the directives that are not media related", () => {
    const csp = buildCsp("https://d123.cloudfront.net");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("base-uri 'self'");
    expect(directive(csp, "default-src")).toBe("default-src 'self'");
  });

  it("does not let a media origin widen script-src", () => {
    const csp = buildCsp("https://evil.example.com");
    expect(directive(csp, "script-src")).not.toContain("evil.example.com");
  });

  /**
   * The browser talks to portfolio_api directly for the referral-links demo,
   * so the API origin has to be in connect-src. It used to be the production
   * hostname, hardcoded, which meant the demo was blocked by our own CSP on
   * every local checkout -- the README tells you to point at localhost:3001.
   *
   * Following API_URL rather than naming a host keeps the policy honest: it
   * allows wherever the app actually calls, and nowhere else.
   */
  it("allows the API origin the app is configured to call", () => {
    const connect = directive(buildCsp(undefined, { apiUrl: "http://localhost:3001" }), "connect-src");
    expect(connect).toContain("http://localhost:3001");
  });

  it("allows the production API when that is what is configured", () => {
    const connect = directive(
      buildCsp(undefined, { apiUrl: "https://api.paulsumido.com" }),
      "connect-src",
    );
    expect(connect).toContain("https://api.paulsumido.com");
  });

  it("does not smuggle in a hardcoded API host", () => {
    const connect = directive(buildCsp(undefined, { apiUrl: "http://localhost:3001" }), "connect-src");
    expect(connect).not.toContain("api.paulsumido.com");
  });

  it("reduces an API URL with a path to a bare origin", () => {
    const connect = directive(
      buildCsp(undefined, { apiUrl: "https://api.paulsumido.com/api/" }),
      "connect-src",
    );
    expect(connect).toContain("https://api.paulsumido.com");
    expect(connect).not.toContain("/api/");
  });

  it("keeps the other connect origins when an API origin is added", () => {
    const connect = directive(buildCsp(undefined, { apiUrl: "http://localhost:3001" }), "connect-src");
    expect(connect).toContain("'self'");
    expect(connect).toContain("https://vitals.vercel-insights.com");
    expect(connect).toContain("wss://realtime.ably.io");
  });

  it("does not let the API origin widen script-src", () => {
    const csp = buildCsp(undefined, { apiUrl: "https://evil.example.com" });
    expect(directive(csp, "script-src")).not.toContain("evil.example.com");
  });

  it("allows eval in development, which React's dev build needs to build callstacks", () => {
    const csp = buildCsp(undefined, { dev: true });
    expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
  });

  it("never allows eval in production, where React does not use it", () => {
    const csp = buildCsp(undefined, { dev: false });
    expect(directive(csp, "script-src")).not.toContain("'unsafe-eval'");
  });

  it("defaults to the locked-down production policy when nothing is passed", () => {
    // The safe default matters: a missing flag must not silently open eval.
    expect(directive(buildCsp(undefined), "script-src")).not.toContain(
      "'unsafe-eval'",
    );
  });

  it("keeps wasm-unsafe-eval in both modes, since the Draco decoder needs it", () => {
    expect(directive(buildCsp(undefined, { dev: true }), "script-src")).toContain(
      "'wasm-unsafe-eval'",
    );
    expect(
      directive(buildCsp(undefined, { dev: false }), "script-src"),
    ).toContain("'wasm-unsafe-eval'");
  });
});
