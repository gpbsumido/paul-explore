import { describe, it, expect } from "vitest";

import { filterSalesForRange, salesByDay, salesByPeriod } from "@/lib/operator-sales";
import { alertsByDay } from "@/lib/operator-detail";
import type { Sale, Alert } from "@/types/operator";

const VANCOUVER = "America/Vancouver";

function sale(timestamp: string, total = 10): Sale {
  return {
    id: `sale-${timestamp}`,
    storeId: "store-001",
    productName: "Energy Bar",
    category: "snacks",
    unitPrice: total,
    quantity: 1,
    total,
    timestamp,
  };
}

function alert(timestamp: string): Alert {
  return {
    id: `alert-${timestamp}`,
    storeId: "store-001",
    severity: "warning",
    category: "low-stock",
    message: "Running low",
    timestamp,
    acknowledged: false,
  };
}

describe("salesByDay in a store's zone", () => {
  // 06:30Z on Jun 15 is 23:30 on Jun 14 in Vancouver -- the exact sale a UTC
  // floor pushed into the wrong day.
  const lateEvening = sale("2026-06-15T06:30:00Z", 42);
  const now = new Date("2026-06-15T20:00:00Z");

  it("keeps a late-evening local sale on its own day", () => {
    const buckets = salesByDay([lateEvening], now, VANCOUVER);
    const yesterday = buckets[buckets.length - 2];
    const today = buckets[buckets.length - 1];

    expect(yesterday.revenue).toBe(42);
    expect(today.revenue).toBe(0);
  });

  it("files that same sale under today when bucketed in UTC", () => {
    const buckets = salesByDay([lateEvening], now, "UTC");
    expect(buckets[buckets.length - 1].revenue).toBe(42);
  });

  it("labels the newest bucket with the local weekday", () => {
    const buckets = salesByDay([], now, VANCOUVER);
    // Jun 15 2026 is a Monday.
    expect(buckets[buckets.length - 1].day).toBe("Mon");
  });
});

describe("filterSalesForRange in a store's zone", () => {
  const now = new Date("2026-06-15T20:00:00Z");

  it("includes a sale made just before local midnight tonight", () => {
    // 06:59Z Jun 16 is 23:59 Jun 15 in Vancouver, still inside today.
    const kept = filterSalesForRange(
      [sale("2026-06-16T06:59:00Z")],
      "day",
      now,
      VANCOUVER,
    );
    expect(kept).toHaveLength(1);
  });

  it("excludes a sale that has already crossed into tomorrow locally", () => {
    // 07:01Z Jun 16 is 00:01 Jun 16 in Vancouver, past the window's end.
    const kept = filterSalesForRange(
      [sale("2026-06-16T07:01:00Z")],
      "day",
      now,
      VANCOUVER,
    );
    expect(kept).toHaveLength(0);
  });
});

describe("salesByPeriod in a store's zone", () => {
  const now = new Date("2026-06-15T20:00:00Z");

  it("starts day buckets on local midnight", () => {
    const buckets = salesByPeriod([], "day", now, VANCOUVER);
    expect(buckets[buckets.length - 1].start).toBe("2026-06-15T07:00:00.000Z");
  });

  it("still starts on UTC midnight when no zone is given", () => {
    const buckets = salesByPeriod([], "day", now);
    expect(buckets[buckets.length - 1].start).toBe("2026-06-15T00:00:00.000Z");
  });

  it("puts a late-evening local sale in the right day bucket", () => {
    const buckets = salesByPeriod(
      [sale("2026-06-15T06:30:00Z", 42)],
      "day",
      now,
      VANCOUVER,
    );
    expect(buckets[buckets.length - 2].revenue).toBe(42);
    expect(buckets[buckets.length - 1].revenue).toBe(0);
  });
});

describe("alertsByDay in a store's zone", () => {
  const now = new Date("2026-06-15T20:00:00Z");

  it("buckets an early-morning UTC alert into the previous local day", () => {
    // 02:00Z Jun 15 is 19:00 Jun 14 in Vancouver.
    const buckets = alertsByDay([alert("2026-06-15T02:00:00Z")], now, 7, VANCOUVER);
    expect(buckets[buckets.length - 2].count).toBe(1);
    expect(buckets[buckets.length - 1].count).toBe(0);
  });

  it("counts that same alert as today in UTC", () => {
    const buckets = alertsByDay([alert("2026-06-15T02:00:00Z")], now, 7, "UTC");
    expect(buckets[buckets.length - 1].count).toBe(1);
  });

  it("survives a spring-forward day without dropping a bucket", () => {
    const springNow = new Date("2026-03-09T20:00:00Z");
    const buckets = alertsByDay(
      [alert("2026-03-08T18:00:00Z")],
      springNow,
      7,
      "America/Toronto",
    );
    expect(buckets).toHaveLength(7);
    expect(buckets[buckets.length - 2].count).toBe(1);
  });
});
