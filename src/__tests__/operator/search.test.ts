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

  it("labels a store with its status, or plain 'Store' when it has none", () => {
    const index = buildSearchIndex({
      stores: [
        { id: "s1", name: "With Status", status: "online" },
        { id: "s2", name: "Without Status" },
      ],
      products: [],
    });
    expect(index.find((i) => i.id === "store-s1")?.sublabel).toBe("online");
    expect(index.find((i) => i.id === "store-s2")?.sublabel).toBe("Store");
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

  it("ranks a prefix above a word start, then a mid-word hit, then a subsequence, then a sublabel hit", () => {
    // Listed so that label length would give the opposite order: only the
    // match quality can put the longest label first.
    const index = buildSearchIndex({
      stores: [],
      products: [
        { name: "Zed", category: "snack bar" },
        { name: "Banner", category: "misc" },
        { name: "Crowbar", category: "misc" },
        { name: "Energy Bar", category: "misc" },
        { name: "Bar Nuts Deluxe Edition", category: "misc" },
      ],
    });
    expect(searchItems(index, "bar").map((r) => r.label)).toEqual([
      "Bar Nuts Deluxe Edition",
      "Energy Bar",
      "Crowbar",
      "Banner",
      "Zed",
    ]);
  });

  it("treats the letter after a hyphen as the start of a word", () => {
    const index = buildSearchIndex({
      stores: [],
      products: [
        { name: "Cold-Brew Concentrate Pack", category: "misc" },
        { name: "Newbrew", category: "misc" },
      ],
    });
    expect(searchItems(index, "brew").map((r) => r.label)).toEqual([
      "Cold-Brew Concentrate Pack",
      "Newbrew",
    ]);
  });

  it("matches regardless of case", () => {
    const index = buildSearchIndex(INDEX_INPUT);
    expect(searchItems(index, "GYM")[0].label).toBe("Gym Vending - Rec Center");
  });

  it("finds a store by its status", () => {
    const index = buildSearchIndex(INDEX_INPUT);
    expect(searchItems(index, "degraded").map((r) => r.label)).toEqual([
      "Lobby Fridge - Building A",
    ]);
  });

  it("returns nothing when the query matches no label", () => {
    const index = buildSearchIndex(INDEX_INPUT);
    expect(searchItems(index, "zzzz")).toEqual([]);
  });

  it("puts the shorter label first, then alphabetical, when matches tie", () => {
    const index = buildSearchIndex({
      stores: [],
      products: [
        { name: "Cola Alpha Pack", category: "misc" },
        { name: "Cola Zed", category: "misc" },
        { name: "Cola Mix", category: "misc" },
        { name: "Cola Max", category: "misc" },
      ],
    });
    expect(searchItems(index, "cola").map((r) => r.label)).toEqual([
      "Cola Max",
      "Cola Mix",
      "Cola Zed",
      "Cola Alpha Pack",
    ]);
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

  it("shows eight results by default", () => {
    const index = buildSearchIndex({
      stores: Array.from({ length: 20 }, (_, i) => ({
        id: `s${i}`,
        name: `Store ${i}`,
      })),
      products: [],
    });
    expect(searchItems(index, "store")).toHaveLength(8);
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
