import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FEATURES, THOUGHTS } from "../featureData.data";
import { isSessionProtectedPath } from "@/lib/protectedPaths";
import { FEATURES as ViaTsx, THOUGHTS as ThoughtsViaTsx } from "../featureData";

const source = readFileSync(
  join(process.cwd(), "src/app/_shared/featureData.data.ts"),
  "utf8",
);

describe("featureData.data", () => {
  it("stays a plain module, so data-only consumers pay nothing for UI", () => {
    // The whole point of the split: no client boundary, no animation library.
    // Matched as a real directive and real imports, not prose -- the file's own
    // doc comment mentions both by name.
    expect(source).not.toMatch(/^\s*["']use client["']/m);
    expect(source).not.toMatch(/from\s+["'][^"']*framer-motion["']/);
    expect(source).not.toMatch(/from\s+["']react["']/);
  });

  it("holds no JSX, which is what made the split possible", () => {
    expect(source).not.toMatch(/=>\s*\(?\s*</);
    expect(source).not.toMatch(/<[A-Z][A-Za-z]*/);
  });

  it("is the same data the components module re-exports", () => {
    // The .tsx re-exports from here, so ~20 existing importers keep working.
    expect(ViaTsx).toBe(FEATURES);
    expect(ThoughtsViaTsx).toBe(THOUGHTS);
  });

  it("carries the full feature and write-up lists", () => {
    expect(FEATURES.length).toBeGreaterThan(10);
    expect(THOUGHTS.length).toBeGreaterThan(20);
    expect(FEATURES.every((f) => f.id && f.title && f.href)).toBe(true);
    expect(THOUGHTS.every((t) => t.title && t.href)).toBe(true);
  });

  it("sends EVAR Sizing to its own domain, now that it lives in its own project", () => {
    expect(FEATURES.find((f) => f.id === "evar")?.href).toBe("https://medical.paulsumido.com");
  });
});

/**
 * A hub card is the front door for a guest. One that points behind a login
 * bounces them straight to sign-in for a page they never asked to use, which
 * is what the Volunteer Check-in card did by linking to the organizer list.
 */
describe("hub card links", () => {
  // A personal calendar has nothing to show a guest, and the login redirect
  // carries returnTo, so this one is gated on purpose.
  const GATED_ON_PURPOSE = new Set(["/calendar"]);

  const guestFacing = FEATURES.filter(
    (f) => f.href.startsWith("/") && !GATED_ON_PURPOSE.has(f.href),
  ).map((f) => [f.id, f.href]);

  it.each(guestFacing)("%s opens somewhere a guest can see (%s)", (_id, href) => {
    expect(isSessionProtectedPath(href)).toBe(false);
  });
});
