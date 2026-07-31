import { describe, it, expect } from "vitest";
import {
  PROVINCE_TAX,
  getProvinceTax,
  computeTax,
  buildTaxHistory,
} from "@/lib/operator-tax";
import { buildSale } from "@/test/factories/operator";

// ---------------------------------------------------------------------------
// PROVINCE_TAX table — every Canadian province and territory is covered
// ---------------------------------------------------------------------------

describe("PROVINCE_TAX", () => {
  it("covers all 13 provinces and territories", () => {
    const codes = Object.keys(PROVINCE_TAX);
    expect(codes).toHaveLength(13);
    expect(codes).toEqual(
      expect.arrayContaining([
        "AB",
        "BC",
        "MB",
        "NB",
        "NL",
        "NS",
        "NT",
        "NU",
        "ON",
        "PE",
        "QC",
        "SK",
        "YT",
      ]),
    );
  });

  it("gives GST-only provinces a 5% federal rate and no provincial tax", () => {
    for (const code of ["AB", "NT", "NU", "YT"] as const) {
      expect(PROVINCE_TAX[code].gst).toBe(0.05);
      expect(PROVINCE_TAX[code].pst).toBe(0);
      expect(PROVINCE_TAX[code].hst).toBe(0);
    }
  });

  it("gives HST provinces a combined rate and no separate GST/PST", () => {
    expect(PROVINCE_TAX.ON.hst).toBe(0.13);
    expect(PROVINCE_TAX.NS.hst).toBe(0.14);
    expect(PROVINCE_TAX.NB.hst).toBe(0.15);
    for (const code of ["ON", "NS", "NB", "NL", "PE"] as const) {
      expect(PROVINCE_TAX[code].gst).toBe(0);
      expect(PROVINCE_TAX[code].pst).toBe(0);
    }
  });

  it("gives GST+PST provinces both a 5% federal and a provincial rate", () => {
    expect(PROVINCE_TAX.BC.gst).toBe(0.05);
    expect(PROVINCE_TAX.BC.pst).toBe(0.07);
    expect(PROVINCE_TAX.SK.pst).toBe(0.06);
    expect(PROVINCE_TAX.QC.pst).toBe(0.09975);
    for (const code of ["BC", "MB", "SK", "QC"] as const) {
      expect(PROVINCE_TAX[code].hst).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// getProvinceTax — safe lookup with a label
// ---------------------------------------------------------------------------

describe("getProvinceTax", () => {
  it("returns the rate config with a human label", () => {
    const on = getProvinceTax("ON");
    expect(on.code).toBe("ON");
    expect(on.name).toBe("Ontario");
    expect(on.hst).toBe(0.13);
  });
});

// ---------------------------------------------------------------------------
// computeTax — breakdown by province, rounded to cents
// ---------------------------------------------------------------------------

describe("computeTax", () => {
  it("applies HST for HST provinces", () => {
    const result = computeTax(100, "ON");
    expect(result.hst).toBe(13);
    expect(result.gst).toBe(0);
    expect(result.pst).toBe(0);
    expect(result.taxTotal).toBe(13);
    expect(result.total).toBe(113);
  });

  it("applies GST only for GST-only provinces", () => {
    const result = computeTax(100, "AB");
    expect(result.gst).toBe(5);
    expect(result.pst).toBe(0);
    expect(result.hst).toBe(0);
    expect(result.taxTotal).toBe(5);
    expect(result.total).toBe(105);
  });

  it("applies GST plus PST for GST+PST provinces", () => {
    const result = computeTax(100, "BC");
    expect(result.gst).toBe(5);
    expect(result.pst).toBe(7);
    expect(result.hst).toBe(0);
    expect(result.taxTotal).toBe(12);
    expect(result.total).toBe(112);
  });

  it("applies Quebec's 9.975% QST as the provincial component", () => {
    const result = computeTax(200, "QC");
    expect(result.gst).toBe(10);
    expect(result.pst).toBe(19.95);
    expect(result.taxTotal).toBe(29.95);
    expect(result.total).toBe(229.95);
  });

  it("rounds each component to the nearest cent", () => {
    const result = computeTax(19.99, "ON");
    // 19.99 * 0.13 = 2.5987 -> 2.60
    expect(result.hst).toBe(2.6);
    expect(result.total).toBe(22.59);
  });

  it("returns all-zero tax for a zero subtotal", () => {
    const result = computeTax(0, "BC");
    expect(result.gst).toBe(0);
    expect(result.pst).toBe(0);
    expect(result.taxTotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it("keeps the original subtotal on the result", () => {
    expect(computeTax(42.5, "ON").subtotal).toBe(42.5);
  });
});

// ---------------------------------------------------------------------------
// buildTaxHistory — per-month remittance rows from sales
// ---------------------------------------------------------------------------

describe("buildTaxHistory", () => {
  const now = new Date("2026-07-15T12:00:00Z");

  it("groups sales into monthly periods newest-first", () => {
    const sales = [
      buildSale({ total: 100, timestamp: "2026-07-01T10:00:00Z" }),
      buildSale({ total: 200, timestamp: "2026-06-10T10:00:00Z" }),
      buildSale({ total: 50, timestamp: "2026-06-20T10:00:00Z" }),
    ];
    const history = buildTaxHistory(sales, "ON", now);
    expect(history).toHaveLength(2);
    expect(history[0].period).toBe("2026-07");
    expect(history[1].period).toBe("2026-06");
  });

  it("sums the subtotal per period and computes tax on it", () => {
    const sales = [
      buildSale({ total: 100, timestamp: "2026-06-10T10:00:00Z" }),
      buildSale({ total: 50, timestamp: "2026-06-20T10:00:00Z" }),
    ];
    const history = buildTaxHistory(sales, "ON", now);
    expect(history[0].subtotal).toBe(150);
    expect(history[0].hst).toBe(19.5);
    expect(history[0].total).toBe(169.5);
  });

  it("returns an empty history when there are no sales", () => {
    expect(buildTaxHistory([], "ON", now)).toEqual([]);
  });
});
