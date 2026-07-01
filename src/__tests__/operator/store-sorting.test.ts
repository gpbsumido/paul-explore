import { describe, it, expect } from "vitest";
import { sortStores, filterStores } from "@/lib/operator-utils";
import { buildStore } from "@/test/factories/operator";
import type { Store } from "@/types/operator";

// ---------------------------------------------------------------------------
// sortStores — worst-first ordering
// ---------------------------------------------------------------------------

describe("sortStores", () => {
  it("ranks offline before degraded before online", () => {
    const online = buildStore({ id: "s-online", status: "online" });
    const degraded = buildStore({ id: "s-degraded", status: "degraded" });
    const offline = buildStore({ id: "s-offline", status: "offline" });

    const sorted = sortStores([online, degraded, offline], new Map());
    expect(sorted.map((s) => s.id)).toEqual([
      "s-offline",
      "s-degraded",
      "s-online",
    ]);
  });

  it("ranks degraded with alerts before degraded without", () => {
    const degradedNoAlerts = buildStore({
      id: "s-degraded-quiet",
      status: "degraded",
    });
    const degradedWithAlerts = buildStore({
      id: "s-degraded-loud",
      status: "degraded",
    });

    const alertCounts = new Map([["s-degraded-loud", 3]]);

    const sorted = sortStores(
      [degradedNoAlerts, degradedWithAlerts],
      alertCounts,
    );
    expect(sorted.map((s) => s.id)).toEqual([
      "s-degraded-loud",
      "s-degraded-quiet",
    ]);
  });

  it("preserves relative order for stores with the same priority", () => {
    const a = buildStore({ id: "s-a", status: "online" });
    const b = buildStore({ id: "s-b", status: "online" });
    const c = buildStore({ id: "s-c", status: "online" });

    const sorted = sortStores([a, b, c], new Map());
    expect(sorted.map((s) => s.id)).toEqual(["s-a", "s-b", "s-c"]);
  });

  it("does not mutate the original array", () => {
    const stores: readonly Store[] = [
      buildStore({ id: "s-1", status: "online" }),
      buildStore({ id: "s-2", status: "offline" }),
    ];

    const sorted = sortStores(stores, new Map());
    expect(sorted).not.toBe(stores);
    expect(stores[0].id).toBe("s-1");
  });

  it("handles an empty array", () => {
    expect(sortStores([], new Map())).toEqual([]);
  });

  it("applies the full priority chain in a mixed fleet", () => {
    const online = buildStore({ id: "s-online", status: "online" });
    const degradedQuiet = buildStore({
      id: "s-degraded-quiet",
      status: "degraded",
    });
    const degradedLoud = buildStore({
      id: "s-degraded-loud",
      status: "degraded",
    });
    const offline = buildStore({ id: "s-offline", status: "offline" });

    const alertCounts = new Map([["s-degraded-loud", 2]]);

    const sorted = sortStores(
      [online, degradedQuiet, degradedLoud, offline],
      alertCounts,
    );
    expect(sorted.map((s) => s.id)).toEqual([
      "s-offline",
      "s-degraded-loud",
      "s-degraded-quiet",
      "s-online",
    ]);
  });
});

// ---------------------------------------------------------------------------
// filterStores — status filter + name search
// ---------------------------------------------------------------------------

describe("filterStores", () => {
  const stores: readonly Store[] = [
    buildStore({ id: "s-1", name: "Lobby Fridge", status: "online" }),
    buildStore({ id: "s-2", name: "Break Room Cooler", status: "degraded" }),
    buildStore({ id: "s-3", name: "Cafeteria Unit", status: "offline" }),
    buildStore({ id: "s-4", name: "Gym Vending", status: "online" }),
  ];

  it("returns all stores when status is 'all' and search is empty", () => {
    const result = filterStores(stores, { status: "all", search: "" });
    expect(result).toHaveLength(4);
  });

  it("filters by status", () => {
    const result = filterStores(stores, { status: "online", search: "" });
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.status === "online")).toBe(true);
  });

  it("filters by name search (case-insensitive)", () => {
    const result = filterStores(stores, { status: "all", search: "lobby" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s-1");
  });

  it("combines status and search filters", () => {
    const result = filterStores(stores, { status: "online", search: "gym" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s-4");
  });

  it("returns empty array when nothing matches", () => {
    const result = filterStores(stores, {
      status: "all",
      search: "nonexistent",
    });
    expect(result).toEqual([]);
  });

  it("matches partial name substrings", () => {
    const result = filterStores(stores, { status: "all", search: "room" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s-2");
  });
});
