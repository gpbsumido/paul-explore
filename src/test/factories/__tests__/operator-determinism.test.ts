import { describe, expect, it } from "vitest";
import {
  buildActivityList,
  buildAlert,
  buildInventoryList,
  buildSalesList,
  buildStoreList,
  pinFactories,
  PINNED_FACTORY_NOW,
  seededRandom,
} from "../operator";

const HOUR_MS = 60 * 60 * 1000;

const seededSnapshot = (seed: number) => {
  pinFactories({ random: seededRandom(seed), now: PINNED_FACTORY_NOW });
  return {
    stores: buildStoreList(4),
    inventory: buildInventoryList("store-001", 6),
    activity: buildActivityList("store-001", 5),
    sales: buildSalesList("store-001", 12, 7),
  };
};

describe("operator factories", () => {
  it("build the same data again once pinned to the same seed", () => {
    expect(seededSnapshot(7)).toEqual(seededSnapshot(7));
  });

  it("build different data for a different seed", () => {
    expect(seededSnapshot(7).sales).not.toEqual(seededSnapshot(8).sales);
  });

  it("date their records against the pinned clock, not the real one", () => {
    pinFactories({ random: seededRandom(1), now: PINNED_FACTORY_NOW });
    const ageInHours =
      (PINNED_FACTORY_NOW.getTime() - Date.parse(buildAlert().timestamp)) / HOUR_MS;
    expect(ageInHours).toBeGreaterThanOrEqual(0);
    expect(ageInHours).toBeLessThanOrEqual(24);
  });

  it("are already pinned by the test setup, with no call from the test", () => {
    const ageInHours =
      (PINNED_FACTORY_NOW.getTime() - Date.parse(buildAlert().timestamp)) / HOUR_MS;
    expect(ageInHours).toBeGreaterThanOrEqual(0);
    expect(ageInHours).toBeLessThanOrEqual(24);
  });
});
