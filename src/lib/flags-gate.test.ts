import { describe, it, expect } from "vitest";
import { isFeatureEnabled, loadPocketGate, POCKET_TCG_FLAG } from "./flags-gate";
import {
  buildFlag,
  buildEnvironmentConfig,
  percentRollout,
} from "@/test/factories/flags";

const onEverywhere = () =>
  buildFlag({
    key: POCKET_TCG_FLAG,
    environments: {
      development: buildEnvironmentConfig({ fallthrough: percentRollout(100) }),
      staging: buildEnvironmentConfig({ fallthrough: percentRollout(100) }),
      production: buildEnvironmentConfig({ fallthrough: percentRollout(100) }),
    },
  });

describe("isFeatureEnabled", () => {
  it("is on when the flag serves the on variation to everyone", () => {
    expect(isFeatureEnabled(onEverywhere(), "production", "visitor-1")).toBe(
      true,
    );
  });

  it("is off when the kill switch is off, regardless of visitor", () => {
    const killed = buildFlag({
      environments: {
        development: buildEnvironmentConfig({ enabled: false }),
        staging: buildEnvironmentConfig({ enabled: false }),
        production: buildEnvironmentConfig({ enabled: false }),
      },
    });
    expect(isFeatureEnabled(killed, "production", "visitor-1")).toBe(false);
  });

  it("is sticky per visitor under a partial rollout", () => {
    const half = buildFlag({
      environments: {
        development: buildEnvironmentConfig({ fallthrough: percentRollout(50) }),
        staging: buildEnvironmentConfig({ fallthrough: percentRollout(50) }),
        production: buildEnvironmentConfig({ fallthrough: percentRollout(50) }),
      },
    });
    const first = isFeatureEnabled(half, "production", "visitor-42");
    const again = isFeatureEnabled(half, "production", "visitor-42");
    expect(again).toBe(first);
  });

  it("fails open when the flag is missing so a config gap never hides the feature", () => {
    expect(isFeatureEnabled(undefined, "production", "visitor-1")).toBe(true);
  });
});

describe("loadPocketGate", () => {
  it("resolves the seeded pocket-tcg flag to enabled for any visitor by default", async () => {
    const decision = await loadPocketGate("visitor-1");
    expect(decision.enabled).toBe(true);
  });
});
