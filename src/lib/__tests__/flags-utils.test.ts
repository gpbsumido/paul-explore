import { describe, it, expect } from "vitest";
import {
  exposurePercent,
  statusOf,
  hasTargeting,
  variationName,
  describeReason,
  kindLabel,
  reasonLabel,
} from "@/lib/flags-utils";
import {
  buildFlag,
  buildEnvironmentConfig,
  buildRule,
  percentRollout,
  fullRollout,
} from "@/test/factories/flags";
import type { EvaluationResult } from "@/types/flags";

describe("exposurePercent", () => {
  it("counts traffic not going to the off variation", () => {
    expect(exposurePercent(buildEnvironmentConfig({ fallthrough: percentRollout(25) }))).toBe(25);
    expect(exposurePercent(buildEnvironmentConfig({ fallthrough: fullRollout("on") }))).toBe(100);
    expect(exposurePercent(buildEnvironmentConfig({ fallthrough: fullRollout("off") }))).toBe(0);
  });
});

describe("statusOf", () => {
  it("is Off when the kill switch is off, whatever the rollout", () => {
    expect(
      statusOf(buildEnvironmentConfig({ enabled: false, fallthrough: fullRollout("on") })).tone,
    ).toBe("off");
  });

  it("is Fully on at 100% with no targeting", () => {
    expect(statusOf(buildEnvironmentConfig({ fallthrough: fullRollout("on") }))).toEqual({
      label: "Fully on",
      tone: "on",
    });
  });

  it("is Partial for a percentage rollout", () => {
    expect(statusOf(buildEnvironmentConfig({ fallthrough: percentRollout(30) })).tone).toBe(
      "partial",
    );
  });

  it("is Targeted when only rules serve the value", () => {
    const status = statusOf(
      buildEnvironmentConfig({ rules: [buildRule()], fallthrough: fullRollout("off") }),
    );
    expect(status).toEqual({ label: "Targeted", tone: "partial" });
  });
});

describe("hasTargeting", () => {
  it("reflects whether any rules are configured", () => {
    expect(hasTargeting(buildEnvironmentConfig({ rules: [] }))).toBe(false);
    expect(hasTargeting(buildEnvironmentConfig({ rules: [buildRule()] }))).toBe(true);
  });
});

describe("variationName", () => {
  it("returns the human name, falling back to the key", () => {
    const flag = buildFlag();
    expect(variationName(flag, "on")).toBe("Enabled");
    expect(variationName(flag, "missing")).toBe("missing");
  });
});

describe("kindLabel", () => {
  it("gives each flag kind a human label", () => {
    expect(kindLabel("boolean")).toBe("Boolean");
    expect(kindLabel("multivariate")).toBe("Multivariate");
  });
});

describe("reasonLabel", () => {
  it("gives each evaluation reason a short tag", () => {
    expect(reasonLabel("OFF")).toBe("Kill switch");
    expect(reasonLabel("RULE_MATCH")).toBe("Targeting rule");
    expect(reasonLabel("FALLTHROUGH")).toBe("Default rollout");
    expect(reasonLabel("FALLTHROUGH_ROLLOUT")).toBe("Percentage rollout");
  });
});

describe("describeReason", () => {
  const flag = buildFlag({
    environments: {
      development: buildEnvironmentConfig({
        rules: [buildRule({ description: "Enterprise plans" })],
      }),
      staging: buildEnvironmentConfig(),
      production: buildEnvironmentConfig(),
    },
  });

  const result = (over: Partial<EvaluationResult>): EvaluationResult => ({
    flagKey: "new-checkout",
    variationKey: "on",
    value: true,
    reason: "OFF",
    ...over,
  });

  it("explains the kill switch", () => {
    expect(describeReason(flag, "development", result({ reason: "OFF" }))).toMatch(/kill switch/i);
  });

  it("names the matched rule", () => {
    expect(
      describeReason(flag, "development", result({ reason: "RULE_MATCH", ruleIndex: 0 })),
    ).toContain("Enterprise plans");
  });

  it("shows the bucket for a percentage rollout", () => {
    expect(
      describeReason(
        flag,
        "development",
        result({ reason: "FALLTHROUGH_ROLLOUT", bucket: 42.567 }),
      ),
    ).toContain("42.6");
  });
});
