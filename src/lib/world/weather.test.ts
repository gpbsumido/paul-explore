import { describe, it, expect } from "vitest";
import { WEATHER_DRESSING, isWeatherCondition } from "./weather";

describe("isWeatherCondition", () => {
  it.each(Object.keys(WEATHER_DRESSING))("accepts %s, a condition the city can dress for", (condition) => {
    expect(isWeatherCondition(condition)).toBe(true);
  });

  it.each(["hail", "", "toString", null])("rejects %s from a ?w= link", (value) => {
    expect(isWeatherCondition(value)).toBe(false);
  });
});
