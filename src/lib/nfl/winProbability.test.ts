import { describe, it, expect } from "vitest";
import { winProbability } from "./winProbability";

describe("winProbability", () => {
  it("splits evenly when both sides project to the same final", () => {
    const p = winProbability({
      awayActual: 40,
      awayRemaining: 60,
      homeActual: 40,
      homeRemaining: 60,
    });
    expect(p.home).toBeCloseTo(0.5, 5);
    expect(p.away).toBeCloseTo(0.5, 5);
    expect(p.home + p.away).toBeCloseTo(1, 5);
  });

  it("favors the side projecting higher", () => {
    const p = winProbability({
      awayActual: 50,
      awayRemaining: 30,
      homeActual: 70,
      homeRemaining: 30,
    });
    expect(p.home).toBeGreaterThan(0.5);
    expect(p.away).toBeLessThan(0.5);
  });

  it("is near certain once nothing is left to play and one side leads", () => {
    const p = winProbability({
      awayActual: 95,
      awayRemaining: 0,
      homeActual: 120,
      homeRemaining: 0,
    });
    expect(p.home).toBeGreaterThan(0.99);
  });

  it("pulls toward a coin flip when more points are unplayed", () => {
    const early = winProbability({
      awayActual: 0,
      awayRemaining: 110,
      homeActual: 15,
      homeRemaining: 110,
    });
    const late = winProbability({
      awayActual: 90,
      awayRemaining: 5,
      homeActual: 105,
      homeRemaining: 5,
    });
    // Same 15-point projected margin, but the early read is closer to 0.5.
    expect(Math.abs(early.home - 0.5)).toBeLessThan(Math.abs(late.home - 0.5));
  });

  it("is symmetric: swapping the sides complements the probability", () => {
    const a = winProbability({
      awayActual: 60,
      awayRemaining: 40,
      homeActual: 80,
      homeRemaining: 20,
    });
    const swapped = winProbability({
      awayActual: 80,
      awayRemaining: 20,
      homeActual: 60,
      homeRemaining: 40,
    });
    expect(a.home).toBeCloseTo(swapped.away, 5);
  });

  // Anchors the curve itself. Direction alone would pass with any steepness.
  it("puts a settled 2-point lead at about 85% for the leader", () => {
    const p = winProbability({ awayActual: 98, awayRemaining: 0, homeActual: 100, homeRemaining: 0 });
    expect(p.home).toBeCloseTo(0.846, 3);
  });

  it("widens the spread with the points still unplayed", () => {
    const p = winProbability({ awayActual: 0, awayRemaining: 16, homeActual: 10, homeRemaining: 16 });
    expect(p.home).toBeCloseTo(0.782, 3);
  });

  it("copes with a projection that dips below zero rather than returning NaN", () => {
    const p = winProbability({ awayActual: 0, awayRemaining: -4, homeActual: 0, homeRemaining: 0 });
    expect(Number.isNaN(p.home)).toBe(false);
    expect(p.home).toBeGreaterThan(0.5);
  });
});
