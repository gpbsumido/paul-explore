import { describe, it, expect } from "vitest";
import {
  exposurePercent,
  statusOf,
  hasTargeting,
  variationName,
  describeReason,
  kindLabel,
  valueTone,
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

  it("adds up every non-off variation of a multivariate rollout", () => {
    const config = buildEnvironmentConfig({
      fallthrough: [
        { variation: "a", weight: 20 },
        { variation: "b", weight: 30 },
        { variation: "off", weight: 50 },
      ],
    });
    expect(exposurePercent(config)).toBe(50);
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

  it("is Off to all when it is on but nobody is served the value", () => {
    expect(statusOf(buildEnvironmentConfig({ fallthrough: fullRollout("off") }))).toEqual({
      label: "Off to all",
      tone: "off",
    });
  });

  it("is only Partial when a rule exists, even if the fallthrough serves everyone", () => {
    const status = statusOf(
      buildEnvironmentConfig({ rules: [buildRule()], fallthrough: fullRollout("on") }),
    );
    expect(status).toEqual({ label: "Partial", tone: "partial" });
  });

  it("is Partial when rules sit on top of a percentage rollout", () => {
    const status = statusOf(
      buildEnvironmentConfig({ rules: [buildRule()], fallthrough: percentRollout(30) }),
    );
    expect(status).toEqual({ label: "Partial", tone: "partial" });
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

describe("valueTone", () => {
  it("maps a served value to a pill tone", () => {
    expect(valueTone(true)).toBe("on");
    expect(valueTone(false)).toBe("off");
    expect(valueTone("variant-a")).toBe("partial");
    expect(valueTone(3)).toBe("partial");
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

  it("explains that the flag is switched off here", () => {
    expect(describeReason(flag, "development", result({ reason: "OFF" }))).toBe(
      "This flag is switched off here, so everyone gets the default.",
    );
  });

  it("names the matched rule", () => {
    expect(
      describeReason(flag, "development", result({ reason: "RULE_MATCH", ruleIndex: 0 })),
    ).toBe('Matched the rule "Enterprise plans".');
  });

  it("names the rule at the index it matched, not the first one", () => {
    const twoRules = buildFlag({
      environments: {
        development: buildEnvironmentConfig({
          rules: [
            buildRule({ id: "r1", description: "Enterprise plans" }),
            buildRule({ id: "r2", description: "Beta testers" }),
          ],
        }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
      },
    });
    expect(
      describeReason(twoRules, "development", result({ reason: "RULE_MATCH", ruleIndex: 1 })),
    ).toBe('Matched the rule "Beta testers".');
  });

  it("still says a rule matched when the index points at nothing", () => {
    const explain = (over: Partial<EvaluationResult>) =>
      describeReason(flag, "development", result({ reason: "RULE_MATCH", ...over }));
    expect(explain({ ruleIndex: undefined })).toBe("Matched a targeting rule.");
    expect(explain({ ruleIndex: 9 })).toBe("Matched a targeting rule.");
  });

  it("says everyone gets the same value on a plain fallthrough", () => {
    expect(describeReason(flag, "development", result({ reason: "FALLTHROUGH" }))).toBe(
      "No rules matched, so everyone here gets the same value.",
    );
  });

  it("still names the served value for a rollout when there is no bucket to show", () => {
    expect(
      describeReason(
        flag,
        "development",
        result({ reason: "FALLTHROUGH_ROLLOUT", bucket: undefined, variationKey: "off" }),
      ),
    ).toBe("No rules matched, so the rollout decided: Disabled.");
  });

  it("explains a percentage rollout as a dice roll landing on the served value", () => {
    const explanation = describeReason(
      flag,
      "development",
      result({ reason: "FALLTHROUGH_ROLLOUT", bucket: 42.567, variationKey: "on" }),
    );
    expect(explanation).toContain("43 of 100");
    expect(explanation).toContain("Enabled");
  });
});
