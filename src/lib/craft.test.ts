import { describe, it, expect } from "vitest";
import { CRAFT_TRAITS } from "./craft";
import { FEATURES, THOUGHTS } from "@/app/_shared/featureData";

// Routes that aren't features or write-ups but are real, reachable pages the
// craft evidence links point at. Kept small and explicit so a typo in an
// evidence href fails the suite instead of shipping a dead link.
const KNOWN_ROUTES = new Set(["/vitals", "/lab/motion", "/lab/particles"]);

const featureHrefs = new Set(FEATURES.map((f) => f.href));
const thoughtHrefs = new Set(THOUGHTS.map((t) => t.href));

describe("CRAFT_TRAITS", () => {
  it("lists more than a handful of lead traits", () => {
    expect(CRAFT_TRAITS.length).toBeGreaterThanOrEqual(8);
  });

  it("gives every trait a unique id", () => {
    const ids = CRAFT_TRAITS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("backs every trait with at least two pieces of evidence", () => {
    for (const trait of CRAFT_TRAITS) {
      expect(trait.evidence.length, trait.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("only links evidence to real, reachable pages", () => {
    for (const trait of CRAFT_TRAITS) {
      for (const ev of trait.evidence) {
        const known =
          featureHrefs.has(ev.href) ||
          thoughtHrefs.has(ev.href) ||
          KNOWN_ROUTES.has(ev.href);
        expect(known, `${trait.id} -> ${ev.href}`).toBe(true);
      }
    }
  });

  it("gives every trait the copy a card needs", () => {
    for (const trait of CRAFT_TRAITS) {
      expect(trait.title.length, trait.id).toBeGreaterThan(0);
      expect(trait.principle.length, trait.id).toBeGreaterThan(0);
      expect(trait.detail.length, trait.id).toBeGreaterThan(0);
      expect(trait.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
