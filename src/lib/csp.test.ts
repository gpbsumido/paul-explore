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
});
