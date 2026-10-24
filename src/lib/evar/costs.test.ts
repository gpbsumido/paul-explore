import { describe, it, expect } from "vitest";
import {
  BIGGEST,
  MIDDLE,
  PRICES,
  SCENARIO_KEYS,
  SLIDERS,
  SMALLEST,
  SOURCES,
  STEPS,
  estimate,
  toCad,
  usageFor,
  type LineId,
  type Scenario,
} from "./costs";

const scenario = (overrides: Partial<Scenario> = {}): Scenario => ({ ...MIDDLE, ...overrides });

/** One line of an estimate, in dollars. Throws rather than hiding a missing line behind undefined. */
const line = (s: Scenario, id: LineId): number => {
  const found = estimate(s).lines.find((l) => l.id === id);
  if (!found) throw new Error(`the estimate has no ${id} line`);
  return found.cad;
};

const cents = (n: number) => Math.round(n * 100);

describe("toCad", () => {
  it("converts US dollars at the Bank of Canada's rate, to the cent", () => {
    expect(toCad(5)).toBe(7);
    expect(toCad(10.46)).toBe(14.64);
    expect(toCad(15)).toBe(20.99);
    expect(toCad(0)).toBe(0);
  });
});

describe("estimate", () => {
  it("prices a resident's answers by the scan, the minutes and the rate", () => {
    expect(line(scenario({ scans: 100 }), "resident")).toBe(1250);
    expect(line(scenario({ scans: 10, residentPerHour: 100 }), "resident")).toBe(250);
    expect(line(scenario({ scans: 10, minutesPerScan: 30 }), "resident")).toBe(250);
  });

  it("stores each scan as 7.05 MB at S3's Canadian rate", () => {
    expect(line(scenario({ scans: 1000, months: 12 }), "storage")).toBe(2.96);
    expect(line(scenario({ scans: 100, months: 12 }), "storage")).toBe(0.3);
  });

  it("delivers up to a terabyte of scans a month for nothing", () => {
    expect(line(scenario({ peoplePerDay: 50, scansEachPerDay: 30 }), "delivery")).toBe(0);
    // 141,000 opens a month is 994 GB, still inside the free terabyte.
    expect(line(scenario({ peoplePerDay: 100, scansEachPerDay: 47 }), "delivery")).toBe(0);
    expect(estimate(scenario({ peoplePerDay: 100, scansEachPerDay: 47 })).delivery).toBe("free");
  });

  it("pays by the GB just past the free terabyte", () => {
    expect(line(scenario({ peoplePerDay: 50, scansEachPerDay: 100, months: 1 }), "delivery")).toBe(6.84);
    expect(estimate(scenario({ peoplePerDay: 50, scansEachPerDay: 100 })).delivery).toBe("perGb");
  });

  it("moves to CloudFront's flat plan once that's cheaper than paying by the GB", () => {
    expect(line(scenario({ peoplePerDay: 100, scansEachPerDay: 100, months: 1 }), "delivery")).toBe(20.99);
    expect(line(scenario({ peoplePerDay: 100, scansEachPerDay: 100, months: 12 }), "delivery")).toBe(251.88);
    expect(estimate(scenario({ peoplePerDay: 100, scansEachPerDay: 100 })).delivery).toBe("flat");
  });

  it("keeps Railway at its monthly minimum until the study records outgrow it", () => {
    expect(line(scenario({ peoplePerDay: 10, scansEachPerDay: 10, months: 24 }), "servers")).toBe(168);
    expect(line(scenario({ months: 12 }), "servers")).toBe(84);
    expect(line(scenario({ peoplePerDay: 100, scansEachPerDay: 100, months: 24 }), "servers")).toBe(171.56);
  });

  it("pays for the domain a year at a time", () => {
    expect(line(scenario({ months: 3 }), "domain")).toBe(14.64);
    expect(line(scenario({ months: 12 }), "domain")).toBe(14.64);
    expect(line(scenario({ months: 13 }), "domain")).toBe(29.28);
    expect(line(scenario({ months: 24 }), "domain")).toBe(29.28);
  });

  it("keeps the website and sign-in free at every slider position", () => {
    const top = scenario({
      scans: SLIDERS.scans.max,
      peoplePerDay: SLIDERS.peoplePerDay.max,
      scansEachPerDay: SLIDERS.scansEachPerDay.max,
      months: SLIDERS.months.max,
    });
    // Every usage figure only grows as a slider moves up, so the top corner is the most any position uses.
    const usage = usageFor(top);
    expect(usage.callsPerMonth).toBeLessThanOrEqual(PRICES.vercelHobbyCalls.value);
    expect(usage.cpuHoursPerMonth).toBeLessThanOrEqual(PRICES.vercelHobbyCpuHours.value);
    expect(usage.pageGbPerMonth).toBeLessThanOrEqual(PRICES.vercelHobbyTransferGb.value);
    expect(usage.peoplePerMonth).toBeLessThanOrEqual(PRICES.auth0FreeMonthlyUsers.value);
    expect(line(top, "website")).toBe(0);
    expect(line(top, "signIn")).toBe(0);
  });

  it("totals exactly the lines it shows, with the resident's time or without", () => {
    for (const countResident of [true, false]) {
      for (const months of STEPS.months) {
        for (const size of [SMALLEST, MIDDLE, BIGGEST]) {
          const { lines, total } = estimate({ ...size, months }, { countResident });
          expect(cents(total)).toBe(lines.reduce((sum, l) => sum + cents(l.cad), 0));
        }
      }
    }
  });

  it("leaves the resident's time out when asked, and totals the rest", () => {
    const { lines, total } = estimate(MIDDLE, { countResident: false });
    expect(lines.map((l) => l.id)).not.toContain("resident");
    expect(total).toBe(608.83);
    expect(estimate(MIDDLE, { countResident: true }).total).toBe(1858.83);
  });

  it("adds my $500 base fee once, whatever the length, and outside the 10%", () => {
    expect(line(MIDDLE, "base")).toBe(500);
    expect(line({ ...MIDDLE, months: 3 }, "base")).toBe(500);
    expect(line({ ...MIDDLE, months: 24 }, "base")).toBe(500);
    expect(line(MIDDLE, "fee")).toBe(9.89);
  });

  it("adds my fee, 10% of running the site, as its own line, and never on the resident's time", () => {
    const { lines } = estimate(MIDDLE, { countResident: false });
    expect(lines.at(-1)).toEqual({ id: "fee", cad: 9.89 });
    expect(line(MIDDLE, "fee")).toBe(9.89);
    expect(line({ ...MIDDLE, residentPerHour: 150 }, "fee")).toBe(9.89);
    expect(line({ ...BIGGEST, months: 24 }, "fee")).toBe(71.05);
  });

  it("gives the range without the resident's time", () => {
    const totals = STEPS.months.map((months) =>
      [SMALLEST, MIDDLE, BIGGEST].map((size) => estimate({ ...size, months }, { countResident: false }).total),
    );
    expect(totals).toEqual([
      [539.22, 539.28, 609.29],
      [562.32, 562.47, 702.47],
      [608.54, 608.83, 888.83],
      [717.07, 717.66, 1281.57],
    ]);
  });

  it("gives the range the page prints for each length of time", () => {
    const totals = STEPS.months.map((months) =>
      [SMALLEST, MIDDLE, BIGGEST].map((size) => estimate({ ...size, months }).total),
    );
    expect(totals).toEqual([
      [664.22, 1789.28, 13109.29],
      [687.32, 1812.47, 13202.47],
      [733.54, 1858.83, 13388.83],
      [842.07, 1967.66, 13781.57],
    ]);
  });
});

describe("usageFor", () => {
  it("counts every scan as a download and every visit as three calls plus two a case", () => {
    const usage = usageFor({ peoplePerDay: 100, scansEachPerDay: 100, months: 24 });
    expect(usage.opensPerMonth).toBe(300_000);
    expect(usage.scanGbPerMonth).toBeCloseTo(2115, 6);
    expect(usage.callsPerMonth).toBe(609_000);
    expect(usage.peoplePerMonth).toBe(3000);
  });

  it("works out the page data, the CPU and the records they add up to", () => {
    const usage = usageFor({ peoplePerDay: 100, scansEachPerDay: 100, months: 24 });
    // 3,000 visits at 0.413 MB.
    expect(usage.pageGbPerMonth).toBeCloseTo(1.239, 6);
    // 609,000 calls at 10 ms.
    expect(usage.cpuHoursPerMonth).toBeCloseTo(1.6917, 4);
    // 300,000 records a month at 2 KB, for 24 months.
    expect(usage.recordsGbPerMonth).toBeCloseTo(0.6, 6);
    expect(usage.recordsGb).toBeCloseTo(14.4, 6);
  });
});

describe("PRICES and SOURCES", () => {
  it("names a listed source for every price, and lists no source nothing uses", () => {
    const ids = new Set(SOURCES.map((s) => s.id));
    const used = new Set<string>(Object.values(PRICES).map((p) => p.sourceId));
    expect([...used].filter((id) => !ids.has(id))).toEqual([]);
    expect([...ids].filter((id) => !used.has(id))).toEqual([]);
    expect(SOURCES.every((s) => s.href.startsWith("https://"))).toBe(true);
  });

  it("starts every slider inside its own bounds, on one of its steps", () => {
    for (const key of SCENARIO_KEYS) {
      const { min, max, step } = SLIDERS[key];
      expect(MIDDLE[key], key).toBeGreaterThanOrEqual(min);
      expect(MIDDLE[key], key).toBeLessThanOrEqual(max);
      expect((MIDDLE[key] - min) % step, key).toBe(0);
    }
  });

  it("gives the library slider stops from its bottom to its top, through every step in the tables", () => {
    const { stops, min, max } = SLIDERS.scans;
    expect(stops?.[0]).toBe(min);
    expect(stops?.at(-1)).toBe(max);
    for (const scans of [...STEPS.scans, MIDDLE.scans]) expect(stops).toContain(scans);
    expect(stops).toEqual([...(stops ?? [])].sort((a, b) => a - b));
  });
});
