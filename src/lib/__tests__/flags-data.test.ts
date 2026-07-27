import { describe, it, expect, beforeEach } from "vitest";
import {
  getFlags,
  getFlag,
  getAudit,
  setFlagEnabled,
  setFallthrough,
} from "@/lib/flags-data";
import { flagSchema } from "@/lib/flags-schemas";
import { ENVIRONMENTS } from "@/types/flags";

// The store is a globalThis singleton so it survives across route handlers.
// Clear it before each test to start from the pristine seed.
beforeEach(() => {
  delete (globalThis as Record<string, unknown>).__flagsDataStore;
});

describe("seed data", () => {
  it("every seeded flag is valid against the real schema", () => {
    for (const flag of getFlags()) {
      expect(() => flagSchema.parse(flag)).not.toThrow();
    }
  });

  it("configures every flag in all three environments", () => {
    for (const flag of getFlags()) {
      for (const env of ENVIRONMENTS) {
        expect(flag.environments[env]).toBeDefined();
      }
    }
  });

  it("looks a flag up by key and returns undefined for unknown keys", () => {
    expect(getFlag("new-checkout")?.name).toBe("New checkout flow");
    expect(getFlag("does-not-exist")).toBeUndefined();
  });
});

describe("setFlagEnabled", () => {
  it("flips the kill switch for one environment only", () => {
    const before = getFlag("dark-mode")!;
    expect(before.environments.production!.enabled).toBe(true);

    const updated = setFlagEnabled("dark-mode", "production", false);

    expect(updated?.environments.production!.enabled).toBe(false);
    // Other environments are untouched.
    expect(updated?.environments.development!.enabled).toBe(true);
    // The change is persisted in the store.
    expect(getFlag("dark-mode")?.environments.production!.enabled).toBe(false);
  });

  it("records an audit entry, newest first", () => {
    setFlagEnabled("dark-mode", "staging", false);
    const [latest] = getAudit();
    expect(latest.flagKey).toBe("dark-mode");
    expect(latest.action).toBe("disabled");
    expect(latest.environment).toBe("staging");
  });

  it("returns undefined for an unknown flag", () => {
    expect(setFlagEnabled("nope", "production", false)).toBeUndefined();
  });
});

describe("setFallthrough", () => {
  it("replaces the rollout weights and summarizes the on-percentage in the audit", () => {
    const updated = setFallthrough("new-checkout", "production", [
      { variation: "on", weight: 40 },
      { variation: "off", weight: 60 },
    ]);

    expect(updated?.environments.production!.fallthrough).toEqual([
      { variation: "on", weight: 40 },
      { variation: "off", weight: 60 },
    ]);

    const [latest] = getAudit();
    expect(latest.action).toBe("rollout-changed");
    expect(latest.summary).toContain("40%");
  });
});
