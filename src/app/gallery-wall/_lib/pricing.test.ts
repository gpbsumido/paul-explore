import { describe, it, expect } from "vitest";
import {
  estimatePrintCost,
  formatCad,
  PRINT_PRICES_CAD,
  taxRateFor,
  withTax,
} from "./pricing";
import { FRAME_SIZES } from "./frames";

describe("estimatePrintCost", () => {
  it("costs nothing for an empty wall", () => {
    expect(estimatePrintCost([])).toEqual({
      total: 0,
      priced: 0,
      unpriced: [],
    });
  });

  it("adds up the listed price of every photo", () => {
    const estimate = estimatePrintCost(["8x10", "11x14"]);
    expect(estimate.total).toBeCloseTo(5.49 + 11.69, 2);
    expect(estimate.priced).toBe(2);
  });

  it("charges per copy when the same size appears more than once", () => {
    expect(estimatePrintCost(["8x10", "8x10", "8x10"]).total).toBeCloseTo(
      16.47,
      2,
    );
  });

  it("reports sizes it has no price for instead of guessing", () => {
    const estimate = estimatePrintCost(["8x10", "99x99"]);
    expect(estimate.total).toBeCloseTo(5.49, 2);
    expect(estimate.priced).toBe(1);
    expect(estimate.unpriced).toEqual(["99x99"]);
  });

  it("lists an unknown size once even if it repeats", () => {
    expect(estimatePrintCost(["99x99", "99x99"]).unpriced).toEqual(["99x99"]);
  });

  it("has a price for every frame size the app offers", () => {
    for (const size of FRAME_SIZES) {
      expect(PRINT_PRICES_CAD[size.id]).toBeTypeOf("number");
    }
  });
});

describe("formatCad", () => {
  it("always shows cents", () => {
    expect(formatCad(5)).toBe("$5.00");
    expect(formatCad(17.183)).toBe("$17.18");
  });
});

describe("taxRateFor", () => {
  it("knows the combined rate for a Canadian province", () => {
    expect(
      taxRateFor({ country: "Canada", regionName: "Ontario" }).rate,
    ).toBeCloseTo(0.13, 5);
    expect(
      taxRateFor({ country: "Canada", regionName: "Alberta" }).rate,
    ).toBeCloseTo(0.05, 5);
    expect(
      taxRateFor({ country: "Canada", regionName: "Quebec" }).rate,
    ).toBeCloseTo(0.14975, 5);
  });

  it("is case and whitespace tolerant", () => {
    expect(
      taxRateFor({ country: "canada", regionName: "  british columbia " }).rate,
    ).toBeCloseTo(0.12, 5);
  });

  it("has no rate outside Canada, since the vendor is Canadian", () => {
    expect(
      taxRateFor({ country: "United States", regionName: "New York" }).rate,
    ).toBeNull();
  });

  it("has no rate when the location is unknown", () => {
    expect(taxRateFor(null).rate).toBeNull();
    expect(taxRateFor({ country: "Canada", regionName: null }).rate).toBeNull();
  });

  it("keeps the region name even when it has no known rate", () => {
    expect(taxRateFor({ country: "Canada", regionName: "Atlantis" })).toEqual({
      rate: null,
      region: "Atlantis",
    });
  });
});

describe("withTax", () => {
  it("adds the rate and rounds to cents", () => {
    expect(withTax(100, 0.13)).toBe(113);
    expect(withTax(17.18, 0.13)).toBeCloseTo(19.41, 2);
  });
});
