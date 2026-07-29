import { describe, it, expect } from "vitest";
import { timeOfDayFor, currentTimeOfDay } from "../daylight";

describe("timeOfDayFor", () => {
  it("is night in the small hours", () => {
    expect(timeOfDayFor(0)).toBe("night");
    expect(timeOfDayFor(3.5)).toBe("night");
    expect(timeOfDayFor(5.99)).toBe("night");
  });

  it("is dusk-toned around dawn", () => {
    expect(timeOfDayFor(6)).toBe("dusk");
    expect(timeOfDayFor(7.5)).toBe("dusk");
  });

  it("is day through working hours", () => {
    expect(timeOfDayFor(8)).toBe("day");
    expect(timeOfDayFor(12)).toBe("day");
    expect(timeOfDayFor(17.4)).toBe("day");
  });

  it("is dusk through the golden hour", () => {
    expect(timeOfDayFor(17.5)).toBe("dusk");
    expect(timeOfDayFor(19.9)).toBe("dusk");
  });

  it("is night in the evening", () => {
    expect(timeOfDayFor(20)).toBe("night");
    expect(timeOfDayFor(23.99)).toBe("night");
  });

  it("falls back to night for nonsense hours", () => {
    expect(timeOfDayFor(-1)).toBe("night");
    expect(timeOfDayFor(24.5)).toBe("night");
    expect(timeOfDayFor(Number.NaN)).toBe("night");
  });
});

describe("currentTimeOfDay", () => {
  it("reads the local clock of the given date", () => {
    expect(currentTimeOfDay(new Date(2026, 6, 28, 13, 0))).toBe("day");
    expect(currentTimeOfDay(new Date(2026, 6, 28, 22, 30))).toBe("night");
    expect(currentTimeOfDay(new Date(2026, 6, 28, 18, 45))).toBe("dusk");
  });
});
