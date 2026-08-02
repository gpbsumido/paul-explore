import { describe, it, expect } from "vitest";

import {
  MAX_MEASURE_DAYS,
  activePromotions,
  comparePerformance,
  measurementWindow,
  appliesTo,
  bestDiscountFor,
  describePromotion,
  discountedPrice,
  promotionStatus,
} from "@/lib/operator-promotions";
import { resultingStock } from "@/lib/operator-restock";
import type { Promotion } from "@/types/operator";

const NOW = new Date("2026-08-10T12:00:00.000Z");

const promo = (over: Partial<Promotion> = {}): Promotion => ({
  id: "promo-1",
  storeId: "store-001",
  productName: null,
  percent: 20,
  startsAt: "2026-08-01T00:00:00.000Z",
  endsAt: "2026-08-31T00:00:00.000Z",
  status: "active",
  ...over,
});

describe("promotionStatus", () => {
  it("derives the status rather than trusting the payload", () => {
    // The server said active; the window says it finished a week ago. A tab
    // left open overnight must not keep calling a finished promotion live.
    const stale = promo({
      status: "active",
      endsAt: "2026-08-03T00:00:00.000Z",
    });
    expect(promotionStatus(stale, NOW)).toBe("ended");
  });

  it("reports scheduled, active and ended against a clock", () => {
    expect(
      promotionStatus(promo({ startsAt: "2026-09-01T00:00:00.000Z" }), NOW),
    ).toBe("scheduled");
    expect(promotionStatus(promo(), NOW)).toBe("active");
    expect(
      promotionStatus(promo({ endsAt: "2026-08-05T00:00:00.000Z" }), NOW),
    ).toBe("ended");
  });

  it("stays active indefinitely with no end date", () => {
    const open = promo({ endsAt: null });
    expect(promotionStatus(open, new Date("2030-01-01T00:00:00.000Z"))).toBe(
      "active",
    );
  });
});

describe("appliesTo", () => {
  it("covers everything when there is no product", () => {
    expect(appliesTo(promo({ productName: null }), "Anything")).toBe(true);
  });

  it("covers only its product otherwise", () => {
    const at = promo({ productName: "Energy Bar" });
    expect(appliesTo(at, "Energy Bar")).toBe(true);
    expect(appliesTo(at, "Coca-Cola 355ml")).toBe(false);
  });
});

describe("discountedPrice", () => {
  it("applies the percent and rounds to cents", () => {
    expect(discountedPrice(2.99, 20)).toBe(2.39);
  });

  it("clamps rather than inventing a price", () => {
    expect(discountedPrice(10, 200)).toBe(0);
    expect(discountedPrice(10, -50)).toBe(10);
  });
});

describe("bestDiscountFor", () => {
  it("takes the deepest active discount rather than stacking them", () => {
    // Stacking is almost never what an operator means, and the deepest is both
    // predictable and the one that favours the customer at the fridge.
    const promos = [
      promo({ id: "a", productName: null, percent: 10 }),
      promo({ id: "b", productName: "Energy Bar", percent: 25 }),
    ];
    expect(bestDiscountFor(promos, "Energy Bar", NOW)).toBe(25);
  });

  it("ignores promotions that are not running yet", () => {
    const promos = [
      promo({ id: "a", percent: 40, startsAt: "2026-09-01T00:00:00.000Z" }),
    ];
    expect(bestDiscountFor(promos, "Energy Bar", NOW)).toBe(0);
  });

  it("ignores promotions that have finished", () => {
    const promos = [
      promo({ id: "a", percent: 40, endsAt: "2026-08-02T00:00:00.000Z" }),
    ];
    expect(bestDiscountFor(promos, "Energy Bar", NOW)).toBe(0);
  });

  it("is zero when nothing covers the product", () => {
    expect(bestDiscountFor([], "Energy Bar", NOW)).toBe(0);
  });
});

describe("activePromotions", () => {
  it("keeps only what is running now", () => {
    const promos = [
      promo({ id: "live" }),
      promo({ id: "later", startsAt: "2026-09-01T00:00:00.000Z" }),
      promo({ id: "done", endsAt: "2026-08-02T00:00:00.000Z" }),
    ];
    expect(activePromotions(promos, NOW).map((p) => p.id)).toEqual(["live"]);
  });
});

describe("describePromotion", () => {
  it("reads as a sentence in a list", () => {
    expect(describePromotion(promo({ productName: "Energy Bar" }))).toBe(
      "20% off Energy Bar",
    );
    expect(describePromotion(promo({ productName: null }))).toBe(
      "20% off everything",
    );
  });
});

// ---------------------------------------------------------------------------
// Cross-repo parity
//
// The timezone and restock work both shipped deliberate two-copy helpers, and
// both recaps recorded that the test justifying the duplication did not exist.
// This is it. The vectors below are the same ones portfolio_api asserts, so a
// change to either copy that is not mirrored fails here.
// ---------------------------------------------------------------------------

describe("client and API agree on the shared arithmetic", () => {
  it("discountedPrice matches the API's vectors", () => {
    const vectors: readonly [number, number, number][] = [
      [2.99, 20, 2.39],
      [10, 0, 10],
      [10, 200, 0],
      [10, -50, 10],
    ];
    for (const [price, percent, expected] of vectors) {
      expect(discountedPrice(price, percent)).toBe(expected);
    }
  });

  it("resultingStock matches the API's vectors", () => {
    const vectors = [
      { countedQty: 5, expectedQty: 8, added: 0, removed: 0, capacity: 12, want: 5 },
      { countedQty: null, expectedQty: 8, added: 0, removed: 0, capacity: 12, want: 8 },
      { countedQty: 0, expectedQty: 8, added: 0, removed: 0, capacity: 12, want: 0 },
      { countedQty: 5, expectedQty: 8, added: 4, removed: 2, capacity: 12, want: 7 },
      { countedQty: 2, expectedQty: 8, added: 0, removed: 9, capacity: 12, want: 0 },
      { countedQty: 10, expectedQty: 8, added: 20, removed: 0, capacity: 12, want: 12 },
    ];
    for (const v of vectors) {
      expect(
        resultingStock(
          {
            expectedQty: v.expectedQty,
            countedQty: v.countedQty,
            added: v.added,
            removed: v.removed,
          },
          v.capacity,
        ),
      ).toBe(v.want);
    }
  });
});

describe("measurementWindow", () => {
  it("leaves a normal window alone", () => {
    const from = new Date("2026-08-01T00:00:00.000Z");
    const to = new Date("2026-08-11T00:00:00.000Z");
    const win = measurementWindow(from, to);
    expect(win.start.toISOString()).toBe(from.toISOString());
    expect(win.clamped).toBe(false);
  });

  it("clamps a promotion that has run for years, keeping the end fixed", () => {
    const to = new Date("2026-08-10T12:00:00.000Z");
    const win = measurementWindow(new Date("2024-01-01T00:00:00.000Z"), to);
    expect((win.end.getTime() - win.start.getTime()) / 86_400_000).toBe(
      MAX_MEASURE_DAYS,
    );
    expect(win.end.toISOString()).toBe(to.toISOString());
    expect(win.clamped).toBe(true);
  });
});

describe("comparePerformance", () => {
  const windowStart = new Date("2026-08-01T00:00:00.000Z");
  const windowEnd = new Date("2026-08-11T00:00:00.000Z");
  const sale = (t: string, total: number, quantity: number, productName = "Energy Bar") => ({
    productName,
    quantity,
    total,
    timestamp: t,
  });

  const sales = [
    sale("2026-08-02T10:00:00.000Z", 20, 8),
    sale("2026-07-24T10:00:00.000Z", 25, 5),
    sale("2026-07-01T10:00:00.000Z", 999, 999),
    sale("2026-08-03T10:00:00.000Z", 50, 20, "Coca-Cola 355ml"),
  ];

  it("totals the window and the equal-length baseline before it", () => {
    const r = comparePerformance(
      promo({ productName: "Energy Bar" }),
      sales,
      windowStart,
      windowEnd,
    );
    expect(r.window).toEqual({ units: 8, revenue: 20 });
    expect(r.baseline).toEqual({ units: 5, revenue: 25 });
    expect(r.unitsChangePercent).toBe(60);
    expect(r.revenueChangePercent).toBe(-20);
  });

  it("returns null rather than dividing by a zero baseline", () => {
    const r = comparePerformance(
      promo({ productName: "Brand New Thing" }),
      sales,
      windowStart,
      windowEnd,
    );
    expect(r.unitsChangePercent).toBeNull();
    expect(r.revenueChangePercent).toBeNull();
  });

  it("counts every product for a store-wide promotion", () => {
    const r = comparePerformance(
      promo({ productName: null }),
      sales,
      windowStart,
      windowEnd,
    );
    expect(r.window.units).toBe(28);
  });
});
