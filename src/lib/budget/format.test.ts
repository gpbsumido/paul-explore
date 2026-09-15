import { describe, it, expect } from "vitest";
import { parseAmountToCents, formatCents } from "./format";

describe("parseAmountToCents", () => {
  it("reads a plain dollar amount as integer cents", () => {
    expect(parseAmountToCents("12.34")).toBe(1234);
  });

  it("reads a whole-dollar amount", () => {
    expect(parseAmountToCents("40")).toBe(4000);
  });

  it("pads a single decimal place to cents", () => {
    expect(parseAmountToCents("12.5")).toBe(1250);
  });

  it("tolerates a leading dollar sign and surrounding space", () => {
    expect(parseAmountToCents(" $9.99 ")).toBe(999);
  });

  it("rounds to the nearest cent rather than truncating", () => {
    expect(parseAmountToCents("1.005")).toBe(101);
  });

  it("rejects a zero or negative amount", () => {
    expect(parseAmountToCents("0")).toBeNull();
    expect(parseAmountToCents("-3")).toBeNull();
  });

  it("rejects junk", () => {
    expect(parseAmountToCents("abc")).toBeNull();
    expect(parseAmountToCents("")).toBeNull();
  });
});

describe("formatCents", () => {
  it("renders cents as a dollar string", () => {
    expect(formatCents(1234)).toBe("$12.34");
  });

  it("keeps two decimal places for whole dollars", () => {
    expect(formatCents(4000)).toBe("$40.00");
  });
});
