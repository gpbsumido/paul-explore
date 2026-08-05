import { describe, it, expect } from "vitest";
import { resolveVitalsFilter } from "@/lib/vitalsFilter";

/**
 * The version selector defaults to "Current Major" when the URL has no ?v.
 * The data fetch must resolve to the SAME scope, or first load shows all-time
 * aggregates while the selector claims current major — and re-picking "Current
 * Major" then shows different numbers. resolveVitalsFilter keeps the two in step.
 */
describe("resolveVitalsFilter", () => {
  it("defaults an absent version to the current major, matching the selector", () => {
    expect(resolveVitalsFilter(undefined, "3")).toEqual({
      filterMode: "major",
      filterVersion: "3",
      selectedVersion: "major:3",
    });
  });

  it("decodes an explicit major filter", () => {
    expect(resolveVitalsFilter("major:1", "3")).toEqual({
      filterMode: "major",
      filterVersion: "1",
      selectedVersion: "major:1",
    });
  });

  it("decodes an explicit minor filter", () => {
    expect(resolveVitalsFilter("minor:0.12", "3")).toEqual({
      filterMode: "minor",
      filterVersion: "0.12",
      selectedVersion: "minor:0.12",
    });
  });

  it("treats a bare version as an exact match with no mode", () => {
    expect(resolveVitalsFilter("0.11.3", "3")).toEqual({
      filterMode: undefined,
      filterVersion: "0.11.3",
      selectedVersion: "0.11.3",
    });
  });
});
