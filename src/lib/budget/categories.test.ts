import { describe, it, expect } from "vitest";
import { CATEGORIES, categoryById } from "./categories.data";

describe("categoryById", () => {
  it("finds a preset category by its stored id", () => {
    expect(categoryById("rent")).toMatchObject({ id: "rent", label: "Rent" });
  });

  it("falls back to Other for an id it has never heard of", () => {
    expect(categoryById("deleted-category")).toMatchObject({ id: "other", label: "Other" });
  });

  it("keeps Other as the last preset, since the fallback reads the last entry", () => {
    expect(CATEGORIES[CATEGORIES.length - 1].id).toBe("other");
  });
});
