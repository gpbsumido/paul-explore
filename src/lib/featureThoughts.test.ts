import { describe, it, expect } from "vitest";
import { counterpartFor } from "./featureThoughts";
import { FEATURES } from "@/app/_shared/featureData";

const paired = FEATURES.filter((f) => f.thoughtsHref);

describe("counterpartFor", () => {
  it("sends a feature page to its write-up", () => {
    const result = counterpartFor("/gallery-wall");
    expect(result).toEqual({
      href: "/thoughts/gallery-wall",
      title: "Gallery Wall",
      direction: "to-thoughts",
    });
  });

  it("sends a write-up back to its feature", () => {
    const result = counterpartFor("/thoughts/gallery-wall");
    expect(result).toEqual({
      href: "/gallery-wall",
      title: "Gallery Wall",
      direction: "to-feature",
    });
  });

  it("round-trips every paired feature in both directions", () => {
    for (const feature of paired) {
      const forward = counterpartFor(feature.href);
      expect(forward?.href).toBe(feature.thoughtsHref);
      const back = counterpartFor(feature.thoughtsHref!);
      expect(back?.href).toBe(feature.href);
    }
  });

  it("ignores a trailing slash", () => {
    expect(counterpartFor("/gallery-wall/")?.href).toBe("/thoughts/gallery-wall");
  });

  it("has no counterpart for an unrelated page, or none at all", () => {
    expect(counterpartFor("/settings")).toBeNull();
    expect(counterpartFor(null)).toBeNull();
    expect(counterpartFor("/")).toBeNull();
  });

  it("has no counterpart for a feature without a write-up", () => {
    const unpaired = FEATURES.find((f) => !f.thoughtsHref);
    if (unpaired) expect(counterpartFor(unpaired.href)).toBeNull();
  });
});
