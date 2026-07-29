import { describe, it, expect } from "vitest";
import { WEATHER_DRESSING, precipitationCount, MAX_PARTICLES } from "../weather";

describe("WEATHER_DRESSING", () => {
  it("covers every condition the weather hook can report", () => {
    for (const condition of [
      "clear",
      "partly-cloudy",
      "fog",
      "rain",
      "snow",
      "storm",
      "unknown",
    ] as const) {
      expect(WEATHER_DRESSING[condition]).toBeDefined();
    }
  });

  it("falls back to a clear sky when the forecast is unknown", () => {
    expect(WEATHER_DRESSING.unknown.precipitation).toBe("none");
    expect(WEATHER_DRESSING.clear.precipitation).toBe("none");
  });

  it("rains rain and snows snow", () => {
    expect(WEATHER_DRESSING.rain.precipitation).toBe("rain");
    expect(WEATHER_DRESSING.snow.precipitation).toBe("snow");
    expect(WEATHER_DRESSING.storm.precipitation).toBe("rain");
  });

  it("drops snow slower than rain", () => {
    expect(WEATHER_DRESSING.snow.fallSpeed).toBeLessThan(WEATHER_DRESSING.rain.fallSpeed);
  });

  it("only the storm gets lightning", () => {
    expect(WEATHER_DRESSING.storm.lightning).toBe(true);
    expect(WEATHER_DRESSING.rain.lightning).toBe(false);
  });

  it("thickens the fog for fog and storms, never for a clear day", () => {
    expect(WEATHER_DRESSING.fog.fogScale).toBeLessThan(1);
    expect(WEATHER_DRESSING.storm.fogScale).toBeLessThan(1);
    expect(WEATHER_DRESSING.clear.fogScale).toBe(1);
  });

  it("keeps every dressing renderable", () => {
    for (const dressing of Object.values(WEATHER_DRESSING)) {
      expect(dressing.density).toBeGreaterThanOrEqual(0);
      expect(dressing.density).toBeLessThanOrEqual(1);
      expect(dressing.fogScale).toBeGreaterThan(0);
      expect(dressing.label.length).toBeGreaterThan(0);
    }
  });
});

describe("precipitationCount", () => {
  it("is nothing on a clear day", () => {
    expect(precipitationCount("clear", 1)).toBe(0);
  });

  it("scales with the fidelity slider", () => {
    expect(precipitationCount("rain", 1)).toBeGreaterThan(precipitationCount("rain", 0));
  });

  it("never exceeds the particle budget", () => {
    expect(precipitationCount("storm", 1)).toBeLessThanOrEqual(MAX_PARTICLES);
  });

  it("still shows weather at the lowest fidelity", () => {
    expect(precipitationCount("snow", 0)).toBeGreaterThan(0);
  });
});
