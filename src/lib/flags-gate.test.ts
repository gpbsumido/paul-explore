import { describe, it, expect } from "vitest";
import {
  isFeatureEnabled,
  loadPocketGate,
  loadWorkPortfolioRemoteGate,
  POCKET_TCG_FLAG,
  WORK_PORTFOLIO_REMOTE_FLAG,
} from "./flags-gate";
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

describe("loadWorkPortfolioRemoteGate", () => {
  const remoteFlag = (percent: number) =>
    buildFlag({
      key: WORK_PORTFOLIO_REMOTE_FLAG,
      environments: {
        development: buildEnvironmentConfig({ fallthrough: percentRollout(percent) }),
        staging: buildEnvironmentConfig({ fallthrough: percentRollout(percent) }),
        production: buildEnvironmentConfig({ fallthrough: percentRollout(percent) }),
      },
    });

  it("fails closed: with the flag nowhere, visitors keep the in-repo portfolio", async () => {
    const decision = await loadWorkPortfolioRemoteGate("visitor-1", "production", {
      fleet: async () => ({ flags: [], source: "api" }),
      seed: () => undefined,
    });
    expect(decision).toEqual({ enabled: false, source: "default" });
  });

  it("serves the remote when the live flag is fully rolled out", async () => {
    const decision = await loadWorkPortfolioRemoteGate("visitor-1", "production", {
      fleet: async () => ({ flags: [remoteFlag(100)], source: "api" }),
      seed: () => undefined,
    });
    expect(decision).toEqual({ enabled: true, source: "api" });
  });

  it("keeps the in-repo portfolio at 0%", async () => {
    const decision = await loadWorkPortfolioRemoteGate("visitor-1", "production", {
      fleet: async () => ({ flags: [remoteFlag(0)], source: "api" }),
      seed: () => undefined,
    });
    expect(decision.enabled).toBe(false);
  });

  it("ships seeded off in production, so merging this changes nothing for visitors", async () => {
    const decision = await loadWorkPortfolioRemoteGate("visitor-1", "production", {
      fleet: async () => ({ flags: [], source: "api" }),
    });
    expect(decision).toEqual({ enabled: false, source: "seed" });
  });
});
