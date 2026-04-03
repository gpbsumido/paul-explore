import { describe, it, expect } from "vitest";
import { formatValue, getRatingColor, METRIC_CONFIGS } from "../vitals";

describe("formatValue", () => {
  describe("millisecond metrics (unit = 'ms')", () => {
    it("formats values under 1000ms as rounded milliseconds", () => {
      expect(formatValue(340, "ms")).toBe("340ms");
    });

    it("rounds fractional milliseconds", () => {
      expect(formatValue(340.7, "ms")).toBe("341ms");
    });

    it("formats values at exactly 1000ms as 1.0s", () => {
      expect(formatValue(1000, "ms")).toBe("1.0s");
    });

    it("formats values over 1000ms as seconds with one decimal", () => {
      expect(formatValue(2400, "ms")).toBe("2.4s");
    });

    it("formats 1500ms as 1.5s", () => {
      expect(formatValue(1500, "ms")).toBe("1.5s");
    });
  });

  describe("unitless metrics (unit = '')", () => {
    it("formats CLS as a three-decimal string", () => {
      expect(formatValue(0.042, "")).toBe("0.042");
    });

    it("formats zero CLS as 0.000", () => {
      expect(formatValue(0, "")).toBe("0.000");
    });

    it("formats a poor CLS value correctly", () => {
      expect(formatValue(0.25, "")).toBe("0.250");
    });
  });
});

describe("getRatingColor", () => {
  const { good, poor } = METRIC_CONFIGS.LCP; // 2500 / 4000

  it("returns green for a value at the good threshold", () => {
    expect(getRatingColor(2500, good, poor)).toBe("#22c55e");
  });

  it("returns green for a value below the good threshold", () => {
    expect(getRatingColor(1200, good, poor)).toBe("#22c55e");
  });

  it("returns yellow for a value between good and poor thresholds", () => {
    expect(getRatingColor(3000, good, poor)).toBe("#eab308");
  });

  it("returns yellow for a value at the poor threshold", () => {
    expect(getRatingColor(4000, good, poor)).toBe("#eab308");
  });

  it("returns red for a value above the poor threshold", () => {
    expect(getRatingColor(5000, good, poor)).toBe("#ef4444");
  });

  it("uses the correct thresholds for CLS (unitless)", () => {
    const { good: clsGood, poor: clsPoor } = METRIC_CONFIGS.CLS; // 0.1 / 0.25
    expect(getRatingColor(0.05, clsGood, clsPoor)).toBe("#22c55e");
    expect(getRatingColor(0.15, clsGood, clsPoor)).toBe("#eab308");
    expect(getRatingColor(0.3, clsGood, clsPoor)).toBe("#ef4444");
  });

  it("uses the correct thresholds for INP", () => {
    const { good: inpGood, poor: inpPoor } = METRIC_CONFIGS.INP; // 200 / 500
    expect(getRatingColor(150, inpGood, inpPoor)).toBe("#22c55e");
    expect(getRatingColor(350, inpGood, inpPoor)).toBe("#eab308");
    expect(getRatingColor(600, inpGood, inpPoor)).toBe("#ef4444");
  });
});
