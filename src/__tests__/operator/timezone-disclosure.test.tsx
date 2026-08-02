import { describe, it, expect } from "vitest";

import { storeSchema } from "@/lib/operator-schemas";
import { zoneLabel } from "@/lib/operator-timezone";

const baseStore = {
  id: "store-001",
  name: "Lobby Fridge",
  location: "Building A",
  province: "BC",
  status: "online",
  temperature: 4.2,
  lastPing: "2026-06-15T20:00:00.000Z",
  uptime: 99.1,
  revenue24h: 142.5,
};

describe("storeSchema", () => {
  it("accepts a store carrying a timezone", () => {
    const parsed = storeSchema.parse({
      ...baseStore,
      timezone: "America/Vancouver",
    });
    expect(parsed.timezone).toBe("America/Vancouver");
  });

  it("accepts a store from an API that does not send one yet", () => {
    // The frontend can ship before the API deploy lands; a missing field must
    // not blow up validation for the whole fleet.
    const parsed = storeSchema.parse(baseStore);
    expect(parsed.timezone).toBeUndefined();
  });
});

describe("zoneLabel", () => {
  it("reads as a place, not an offset", () => {
    expect(zoneLabel("America/Vancouver")).toBe("Vancouver");
    expect(zoneLabel("America/St_Johns")).toBe("St Johns");
  });

  it("leaves a zone with no region alone", () => {
    expect(zoneLabel("UTC")).toBe("UTC");
  });
});
