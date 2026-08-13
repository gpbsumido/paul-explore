import { describe, it, expect } from "vitest";
import { buildCsp, mediaOrigin } from "./csp";

const directive = (csp: string, name: string): string =>
  csp.split("; ").find((d) => d.startsWith(`${name} `)) ?? "";

describe("mediaOrigin", () => {
  it("reduces a media URL to a bare origin", () => {
    expect(mediaOrigin("https://d123.cloudfront.net/")).toBe("https://d123.cloudfront.net");
    expect(mediaOrigin("https://bucket.s3.ca-central-1.amazonaws.com/gallery-walls")).toBe(
      "https://bucket.s3.ca-central-1.amazonaws.com",
    );
  });

  it("treats unset, blank, or malformed values as absent", () => {
    expect(mediaOrigin(undefined)).toBeNull();
    expect(mediaOrigin("   ")).toBeNull();
    expect(mediaOrigin("not a url")).toBeNull();
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
