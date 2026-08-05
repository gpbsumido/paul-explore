import { describe, it, expect } from "vitest";
import {
  OPERATOR_TOOLS,
  buildSearchIndex,
  searchItems,
} from "@/lib/operator-search";

const INDEX_INPUT = {
  stores: [
    { id: "s1", name: "Gym Vending - Rec Center", status: "online" },
    { id: "s2", name: "Lobby Fridge - Building A", status: "degraded" },
  ],
  products: [
    { name: "Cold Brew Coffee 350ml", category: "beverages" },
    { name: "Energy Bar", category: "snacks" },
    { name: "Cold Brew Coffee 350ml", category: "beverages" }, // duplicate
  ],
};

// ---------------------------------------------------------------------------
// buildSearchIndex
// ---------------------------------------------------------------------------

describe("buildSearchIndex", () => {
  it("indexes stores with a link to their detail page", () => {
    const index = buildSearchIndex(INDEX_INPUT);
    const store = index.find((i) => i.label === "Gym Vending - Rec Center");
    expect(store?.type).toBe("store");
    expect(store?.href).toBe("/operator/stores/s1");
  });

  it("indexes products once, deduped by name", () => {
    const index = buildSearchIndex(INDEX_INPUT);
    const coffees = index.filter((i) => i.label === "Cold Brew Coffee 350ml");
    expect(coffees).toHaveLength(1);
    expect(coffees[0].type).toBe("product");
    expect(coffees[0].href).toBe("/operator/products");
  });

  it("always includes the operator tools", () => {
    const index = buildSearchIndex({ stores: [], products: [] });
    for (const tool of OPERATOR_TOOLS) {
      expect(index).toContainEqual(tool);
    }
  });
});

// ---------------------------------------------------------------------------
// searchItems
// ---------------------------------------------------------------------------

describe("searchItems", () => {
  it("matches a store by a word in its name", () => {
    const index = buildSearchIndex(INDEX_INPUT);
    const results = searchItems(index, "gym");
    expect(results[0].label).toBe("Gym Vending - Rec Center");
  });

  it("ranks a prefix match above a mid-word match", () => {
    const index = buildSearchIndex({
      stores: [],
      products: [
        { name: "Energy Bar", category: "snacks" },
        { name: "Blueberry Energy Drink", category: "beverages" },
      ],
    });
    const results = searchItems(index, "energy");
    expect(results[0].label).toBe("Energy Bar");
  });

  it("matches a subsequence for fast typing", () => {
    const index = buildSearchIndex(INDEX_INPUT);
    // c-b-c across Cold Brew Coffee
    const labels = searchItems(index, "cbc").map((r) => r.label);
    expect(labels).toContain("Cold Brew Coffee 350ml");
  });

  it("returns the tools as a launcher when the query is empty", () => {
    const index = buildSearchIndex(INDEX_INPUT);
    expect(searchItems(index, "  ")).toEqual(OPERATOR_TOOLS);
  });

  it("caps the number of results", () => {
    const index = buildSearchIndex({
      stores: Array.from({ length: 20 }, (_, i) => ({
        id: `s${i}`,
        name: `Store ${i}`,
      })),
      products: [],
    });
    expect(searchItems(index, "store", 5)).toHaveLength(5);
  });
});
