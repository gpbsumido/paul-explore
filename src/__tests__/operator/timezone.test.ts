import { describe, it, expect } from "vitest";

import {
  DEFAULT_ZONE,
  browserTimeZone,
  dayStartInZone,
  isValidTimeZone,
  storeTimeZone,
  zonedInstant,
  zonedParts,
} from "@/lib/operator-timezone";

describe("isValidTimeZone", () => {
  it("accepts a real IANA zone and rejects anything else", () => {
    expect(isValidTimeZone("America/Vancouver")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });
});

describe("storeTimeZone", () => {
  it("uses the zone the API sent", () => {
    expect(
      storeTimeZone({ province: "ON", timezone: "America/Vancouver" }),
    ).toBe("America/Vancouver");
  });

  it("falls back to the province when the API has not been updated yet", () => {
    expect(storeTimeZone({ province: "BC" })).toBe("America/Vancouver");
    expect(storeTimeZone({ province: "NS" })).toBe("America/Halifax");
  });

  it("ignores a zone this runtime does not recognise", () => {
    expect(storeTimeZone({ province: "ON", timezone: "Nowhere/Land" })).toBe(
      "America/Toronto",
    );
  });

  it("falls back to UTC when there is nothing to go on", () => {
    expect(storeTimeZone(undefined)).toBe(DEFAULT_ZONE);
  });
});

describe("zonedParts", () => {
  it("reads the local wall clock rather than the UTC one", () => {
    // 03:00 UTC on Jun 15 is still the evening of Jun 14 in Vancouver.
    expect(
      zonedParts(new Date("2026-06-15T03:00:00Z"), "America/Vancouver"),
    ).toMatchObject({ year: 2026, month: 6, day: 14, hour: 20 });
  });
});

describe("dayStartInZone", () => {
  it("resolves local midnight to the right instant", () => {
    const start = dayStartInZone(
      new Date("2026-06-15T18:00:00Z"),
      "America/Toronto",
    );
    expect(start.toISOString()).toBe("2026-06-15T04:00:00.000Z");
  });

  it("treats a spring-forward day as 23 hours", () => {
    const a = dayStartInZone(
      new Date("2026-03-08T18:00:00Z"),
      "America/Toronto",
    );
    const b = dayStartInZone(
      new Date("2026-03-09T18:00:00Z"),
      "America/Toronto",
    );
    expect((b.getTime() - a.getTime()) / 3_600_000).toBe(23);
  });

  it("treats a fall-back day as 25 hours", () => {
    const a = dayStartInZone(
      new Date("2026-11-01T18:00:00Z"),
      "America/Toronto",
    );
    const b = dayStartInZone(
      new Date("2026-11-02T18:00:00Z"),
      "America/Toronto",
    );
    expect((b.getTime() - a.getTime()) / 3_600_000).toBe(25);
  });
});

describe("zonedInstant", () => {
  it("rolls a negative day back into the previous month", () => {
    const at = zonedInstant(2026, 7, 0, 0, "UTC");
    expect(at.toISOString()).toBe("2026-06-30T00:00:00.000Z");
  });
});

describe("browserTimeZone", () => {
  it("returns a zone this runtime recognises", () => {
    expect(isValidTimeZone(browserTimeZone())).toBe(true);
  });
});
