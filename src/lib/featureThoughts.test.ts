import { describe, it, expect, vi, afterEach } from "vitest";
import { counterpartFor } from "./featureThoughts";
import { FEATURES } from "@/app/_shared/featureData";

const paired = FEATURES.filter((f) => f.thoughtsHref);

afterEach(() => {
  vi.doUnmock("@/app/_shared/featureData.data");
  vi.resetModules();
});

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

  it("has no counterpart for a feature without a write-up", async () => {
    // Every real feature has a write-up today, so give the lookup one that doesn't.
    vi.resetModules();
    vi.doMock("@/app/_shared/featureData.data", () => ({
      FEATURES: [
        { id: "bare", title: "Bare", href: "/bare", description: "", color: "#000000" },
      ],
    }));
    const { counterpartFor: isolatedCounterpartFor } = await import("./featureThoughts");

    expect(isolatedCounterpartFor("/bare")).toBeNull();
    expect(isolatedCounterpartFor("/thoughts/bare")).toBeNull();
  });

  it.each([
    { path: "/to-do", expected: { href: "/thoughts/to-do", title: "The To-Do List", direction: "to-thoughts" } },
    { path: "/thoughts/to-do", expected: { href: "/to-do", title: "The To-Do List", direction: "to-feature" } },
    { path: "/graphql", expected: { href: "/thoughts/graphql", title: "GraphQL Pok\u00e9dex", direction: "to-thoughts" } },
    { path: "/thoughts/interviewee", expected: { href: "/interviewee", title: "Interviewee", direction: "to-feature" } },
  ])("pairs the unlisted page $path with its counterpart", ({ path, expected }) => {
    expect(counterpartFor(path)).toEqual(expected);
  });
});
