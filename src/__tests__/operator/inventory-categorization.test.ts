import { describe, it, expect } from "vitest";
import {
  categorizeStock,
  computeInventorySummary,
  generateSparklineData,
} from "@/lib/operator-detail";
import { buildInventoryItem } from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// categorizeStock — maps fill ratio to a status label
// ---------------------------------------------------------------------------

describe("categorizeStock", () => {
  it("returns 'out-of-stock' when currentStock is 0", () => {
    expect(categorizeStock(0, 12)).toBe("out-of-stock");
  });

  it("returns 'critical' when fill ratio is below 20%", () => {
    expect(categorizeStock(1, 12)).toBe("critical");
    expect(categorizeStock(2, 12)).toBe("critical");
  });

  it("returns 'low' when fill ratio is between 20% and 50%", () => {
    expect(categorizeStock(3, 12)).toBe("low");
    expect(categorizeStock(5, 12)).toBe("low");
  });

  it("returns 'healthy' when fill ratio is 50% or above", () => {
    expect(categorizeStock(6, 12)).toBe("healthy");
    expect(categorizeStock(12, 12)).toBe("healthy");
  });

  it("returns 'healthy' when stock is at full capacity", () => {
    expect(categorizeStock(20, 20)).toBe("healthy");
  });

  it("returns 'low' right at the 20% boundary (not critical)", () => {
    // 20% of 10 = 2, so exactly 2/10 should be "low"
    expect(categorizeStock(2, 10)).toBe("low");
  });

  it("returns 'healthy' right at the 50% boundary", () => {
    expect(categorizeStock(5, 10)).toBe("healthy");
  });

  it("returns 'critical' just below 20%", () => {
    // 19% of 100 = 19
    expect(categorizeStock(19, 100)).toBe("critical");
  });

  it("returns 'low' just below 50%", () => {
    // 49% of 100 = 49
    expect(categorizeStock(49, 100)).toBe("low");
  });
});

// ---------------------------------------------------------------------------
// computeInventorySummary — aggregates inventory stats
// ---------------------------------------------------------------------------

describe("computeInventorySummary", () => {
  it("counts total items", () => {
    const items = [
      buildInventoryItem({ currentStock: 10, capacity: 12 }),
      buildInventoryItem({ currentStock: 5, capacity: 12 }),
      buildInventoryItem({ currentStock: 1, capacity: 12 }),
    ];
    expect(computeInventorySummary(items).totalItems).toBe(3);
  });

  it("counts items needing restock (critical or out-of-stock)", () => {
    const items = [
      buildInventoryItem({ currentStock: 10, capacity: 12 }), // healthy
      buildInventoryItem({ currentStock: 0, capacity: 12 }), // out-of-stock
      buildInventoryItem({ currentStock: 1, capacity: 12 }), // critical
      buildInventoryItem({ currentStock: 3, capacity: 12 }), // low
    ];
    expect(computeInventorySummary(items).needsRestock).toBe(2);
  });

  it("computes overall fill percentage as an average", () => {
    const items = [
      buildInventoryItem({ currentStock: 12, capacity: 12 }), // 100%
      buildInventoryItem({ currentStock: 6, capacity: 12 }), // 50%
    ];
    expect(computeInventorySummary(items).fillPercentage).toBe(75);
  });

  it("returns 0% fill for empty inventory", () => {
    expect(computeInventorySummary([]).fillPercentage).toBe(0);
  });

  it("returns zero counts for empty inventory", () => {
    const result = computeInventorySummary([]);
    expect(result.totalItems).toBe(0);
    expect(result.needsRestock).toBe(0);
  });

  it("rounds fill percentage to the nearest integer", () => {
    const items = [
      buildInventoryItem({ currentStock: 1, capacity: 3 }), // 33.3%
      buildInventoryItem({ currentStock: 2, capacity: 3 }), // 66.7%
    ];
    // average = 50%
    expect(computeInventorySummary(items).fillPercentage).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// generateSparklineData — simulated 7-day stock trend
// ---------------------------------------------------------------------------

describe("generateSparklineData", () => {
  it("returns exactly 7 data points", () => {
    const data = generateSparklineData(10, 12, "item-001");
    expect(data).toHaveLength(7);
  });

  it("ends with the current stock value", () => {
    const data = generateSparklineData(8, 12, "item-001");
    expect(data[6].stock).toBe(8);
  });

  it("never exceeds capacity", () => {
    const data = generateSparklineData(12, 12, "item-001");
    for (const point of data) {
      expect(point.stock).toBeLessThanOrEqual(12);
    }
  });

  it("never goes below zero", () => {
    const data = generateSparklineData(0, 12, "item-001");
    for (const point of data) {
      expect(point.stock).toBeGreaterThanOrEqual(0);
    }
  });

  it("produces deterministic output for the same seed", () => {
    const a = generateSparklineData(6, 12, "item-abc");
    const b = generateSparklineData(6, 12, "item-abc");
    expect(a).toEqual(b);
  });

  it("produces different output for different seeds", () => {
    const a = generateSparklineData(6, 12, "item-aaa");
    const b = generateSparklineData(6, 12, "item-bbb");
    const aStocks = a.map((p) => p.stock);
    const bStocks = b.map((p) => p.stock);
    expect(aStocks).not.toEqual(bStocks);
  });

  it("each data point has a day label", () => {
    const data = generateSparklineData(5, 10, "item-001");
    for (const point of data) {
      expect(point.day).toBeTruthy();
      expect(typeof point.day).toBe("string");
    }
  });
});
