import { describe, it, expect } from "vitest";
import { vitalsBeaconSchema } from "../schemas";

describe("vitalsBeaconSchema", () => {
  // Matches exactly what WebVitalsReporter sends on each beacon.
  const beacon = {
    metric: "LCP",
    value: 1234.5,
    rating: "good",
    page: "/",
    nav_type: "navigate",
    app_version: "0.16.5",
  };

  it("keeps app_version so the backend records the real version, not 'unknown'", () => {
    const parsed = vitalsBeaconSchema.parse(beacon);
    expect(parsed.app_version).toBe("0.16.5");
  });

  it("keeps nav_type", () => {
    const parsed = vitalsBeaconSchema.parse(beacon);
    expect(parsed.nav_type).toBe("navigate");
  });

  it("still validates the core metric fields", () => {
    const parsed = vitalsBeaconSchema.parse(beacon);
    expect(parsed).toMatchObject({
      metric: "LCP",
      value: 1234.5,
      rating: "good",
      page: "/",
    });
  });
});
