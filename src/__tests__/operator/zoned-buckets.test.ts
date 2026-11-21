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

  it("treats the window as starting at local midnight and ending before the next one", () => {
    // Jun 9 00:00 Vancouver is 07:00Z, the first instant of the 7-day window.
    // Jun 16 00:00 Vancouver is also 07:00Z, which is already outside it.
    const kept = filterSalesForRange(
      [
        sale("2026-06-09T06:59:59Z"),
        sale("2026-06-09T07:00:00Z"),
        sale("2026-06-16T07:00:00Z"),
      ],
      "day",
      now,
      VANCOUVER,
    );
    expect(kept.map((s) => s.timestamp)).toEqual(["2026-06-09T07:00:00Z"]);
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

describe("salesByPeriod months in a store's zone", () => {
  it("files a sale from the last local evening of June under June", () => {
    // 05:00Z Jul 1 is 22:00 Jun 30 in Vancouver.
    const now = new Date("2026-07-15T20:00:00Z");
    const buckets = salesByPeriod(
      [sale("2026-07-01T05:00:00Z", 42)],
      "month",
      now,
      VANCOUVER,
    );
    expect(buckets[buckets.length - 2]).toMatchObject({
      label: "Jun 26",
      revenue: 42,
    });
    expect(buckets[buckets.length - 1].revenue).toBe(0);
  });

  it("ignores a sale older than the window", () => {
    const now = new Date("2026-06-15T20:00:00Z");
    const buckets = salesByPeriod(
      [sale("2020-01-01T00:00:00Z", 99)],
      "day",
      now,
      VANCOUVER,
    );
    expect(buckets.reduce((sum, b) => sum + b.revenue, 0)).toBe(0);
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

  it("puts the day before a spring-forward on its own local day", () => {
    // 04:30Z Mar 8 is 23:30 Mar 7 in Toronto (EST). A flat 24-hour step back
    // from today's EDT midnight would call it Mar 8.
    const springNow = new Date("2026-03-09T20:00:00Z");
    const buckets = alertsByDay(
      [alert("2026-03-08T04:30:00Z")],
      springNow,
      7,
      "America/Toronto",
    );
    expect(buckets[buckets.length - 3].count).toBe(1);
    expect(buckets[buckets.length - 2].count).toBe(0);
  });
});
