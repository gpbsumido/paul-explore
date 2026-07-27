import { describe, it, expect } from "vitest";
import {
  bucketFor,
  evaluateFlag,
  evaluateAllFlags,
} from "@/lib/flags-engine";
import {
  buildFlag,
  buildContext,
  buildEnvironmentConfig,
  buildRule,
  buildClause,
  percentRollout,
  fullRollout,
} from "@/test/factories/flags";

describe("bucketFor", () => {
  it("returns a value in [0, 100)", () => {
    for (const seed of ["a", "b", "new-checkout:user-1", "x".repeat(50)]) {
      const bucket = bucketFor(seed);
      expect(bucket).toBeGreaterThanOrEqual(0);
      expect(bucket).toBeLessThan(100);
    }
  });

  it("is deterministic for the same seed", () => {
    expect(bucketFor("new-checkout:user-42")).toBe(
      bucketFor("new-checkout:user-42"),
    );
  });

  it("produces different buckets for different seeds", () => {
    expect(bucketFor("flag-a:user-1")).not.toBe(bucketFor("flag-b:user-1"));
  });

  it("distributes roughly uniformly across 1000 keys", () => {
    let inLowerFifth = 0;
    for (let i = 0; i < 1000; i++) {
      if (bucketFor(`flag:user-${i}`) < 20) inLowerFifth++;
    }
    // A 20% band should catch ~200 of 1000; allow a generous tolerance.
    expect(inLowerFifth).toBeGreaterThan(140);
    expect(inLowerFifth).toBeLessThan(260);
  });
});

describe("evaluateFlag — kill switch", () => {
  it("serves the off variation with reason OFF when disabled", () => {
    const flag = buildFlag({
      environments: {
        development: buildEnvironmentConfig({
          enabled: false,
          offVariation: "off",
          fallthrough: fullRollout("on"),
        }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
      },
    });

    const result = evaluateFlag(flag, "development", buildContext());

    expect(result.reason).toBe("OFF");
    expect(result.variationKey).toBe("off");
    expect(result.value).toBe(false);
  });
});

describe("evaluateFlag — targeting rules", () => {
  it("serves the first matching rule's variation", () => {
    const flag = buildFlag({
      environments: {
        development: buildEnvironmentConfig({
          rules: [
            buildRule({
              serve: "on",
              clauses: [
                buildClause({ attribute: "plan", op: "in", values: ["enterprise"] }),
              ],
            }),
          ],
          fallthrough: fullRollout("off"),
        }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
      },
    });

    const result = evaluateFlag(
      flag,
      "development",
      buildContext({ attributes: { plan: "enterprise" } }),
    );

    expect(result.reason).toBe("RULE_MATCH");
    expect(result.ruleIndex).toBe(0);
    expect(result.variationKey).toBe("on");
  });

  it("skips a rule whose clause does not match and falls through", () => {
    const flag = buildFlag({
      environments: {
        development: buildEnvironmentConfig({
          rules: [buildRule({ serve: "on" })],
          fallthrough: fullRollout("off"),
        }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
      },
    });

    const result = evaluateFlag(
      flag,
      "development",
      buildContext({ attributes: { plan: "free" } }),
    );

    expect(result.reason).toBe("FALLTHROUGH");
    expect(result.variationKey).toBe("off");
  });

  it("requires every clause in a rule to match (AND)", () => {
    const rule = buildRule({
      serve: "on",
      clauses: [
        buildClause({ attribute: "plan", op: "in", values: ["enterprise"] }),
        buildClause({ attribute: "country", op: "in", values: ["US"] }),
      ],
    });
    const flag = buildFlag({
      environments: {
        development: buildEnvironmentConfig({
          rules: [rule],
          fallthrough: fullRollout("off"),
        }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
      },
    });

    const matched = evaluateFlag(
      flag,
      "development",
      buildContext({ attributes: { plan: "enterprise", country: "US" } }),
    );
    expect(matched.reason).toBe("RULE_MATCH");

    const partial = evaluateFlag(
      flag,
      "development",
      buildContext({ attributes: { plan: "enterprise", country: "CA" } }),
    );
    expect(partial.reason).toBe("FALLTHROUGH");
  });

  it("matches the earliest rule when several would match", () => {
    const flag = buildFlag({
      variations: [
        { key: "on", name: "On", value: true },
        { key: "off", name: "Off", value: false },
      ],
      environments: {
        development: buildEnvironmentConfig({
          rules: [
            buildRule({
              id: "r1",
              serve: "off",
              clauses: [buildClause({ attribute: "plan", op: "in", values: ["pro"] })],
            }),
            buildRule({
              id: "r2",
              serve: "on",
              clauses: [buildClause({ attribute: "plan", op: "in", values: ["pro"] })],
            }),
          ],
          fallthrough: fullRollout("on"),
        }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
      },
    });

    const result = evaluateFlag(
      flag,
      "development",
      buildContext({ attributes: { plan: "pro" } }),
    );
    expect(result.ruleIndex).toBe(0);
    expect(result.variationKey).toBe("off");
  });
});

describe("evaluateFlag — clause operators", () => {
  const evalWith = (clause: ReturnType<typeof buildClause>, attributes: Record<string, string>) =>
    evaluateFlag(
      buildFlag({
        environments: {
          development: buildEnvironmentConfig({
            rules: [buildRule({ serve: "on", clauses: [clause] })],
            fallthrough: fullRollout("off"),
          }),
          staging: buildEnvironmentConfig(),
          production: buildEnvironmentConfig(),
        },
      }),
      "development",
      buildContext({ attributes }),
    ).variationKey;

  it("supports contains / startsWith / endsWith on strings", () => {
    expect(
      evalWith(buildClause({ attribute: "email", op: "contains", values: ["@acme"] }), {
        email: "sam@acme.com",
      }),
    ).toBe("on");
    expect(
      evalWith(buildClause({ attribute: "email", op: "endsWith", values: ["@acme.com"] }), {
        email: "sam@acme.com",
      }),
    ).toBe("on");
    expect(
      evalWith(buildClause({ attribute: "email", op: "startsWith", values: ["beta-"] }), {
        email: "beta-user@x.com",
      }),
    ).toBe("on");
  });

  it("supports notIn as the negation of in", () => {
    expect(
      evalWith(buildClause({ attribute: "plan", op: "notIn", values: ["free"] }), {
        plan: "enterprise",
      }),
    ).toBe("on");
    expect(
      evalWith(buildClause({ attribute: "plan", op: "notIn", values: ["free"] }), {
        plan: "free",
      }),
    ).toBe("off");
  });

  it("reads the context key itself via the 'key' attribute", () => {
    const flag = buildFlag({
      environments: {
        development: buildEnvironmentConfig({
          rules: [
            buildRule({
              serve: "on",
              clauses: [buildClause({ attribute: "key", op: "in", values: ["vip-user"] })],
            }),
          ],
          fallthrough: fullRollout("off"),
        }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
      },
    });
    expect(evaluateFlag(flag, "development", buildContext({ key: "vip-user" })).variationKey).toBe(
      "on",
    );
  });
});

describe("evaluateFlag — percentage rollout", () => {
  it("is sticky: the same context always resolves to the same variation", () => {
    const flag = buildFlag({
      environments: {
        development: buildEnvironmentConfig({ fallthrough: percentRollout(50) }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
      },
    });
    const context = buildContext({ key: "sticky-user" });
    const first = evaluateFlag(flag, "development", context);
    const second = evaluateFlag(flag, "development", context);
    expect(first.variationKey).toBe(second.variationKey);
    expect(first.reason).toBe("FALLTHROUGH_ROLLOUT");
    expect(first.bucket).toBeDefined();
  });

  it("is monotonic: raising the rollout never removes an included user", () => {
    const keys = Array.from({ length: 300 }, (_, i) => `user-${i}`);
    const includedAt = (pct: number) =>
      new Set(
        keys.filter((key) => {
          const flag = buildFlag({
            environments: {
              development: buildEnvironmentConfig({ fallthrough: percentRollout(pct) }),
              staging: buildEnvironmentConfig(),
              production: buildEnvironmentConfig(),
            },
          });
          return evaluateFlag(flag, "development", buildContext({ key })).variationKey === "on";
        }),
      );

    const at20 = includedAt(20);
    const at60 = includedAt(60);
    for (const key of at20) {
      expect(at60.has(key)).toBe(true);
    }
    expect(at60.size).toBeGreaterThan(at20.size);
  });

  it("rolls out roughly the configured percentage across many users", () => {
    let onCount = 0;
    for (let i = 0; i < 1000; i++) {
      const flag = buildFlag({
        environments: {
          development: buildEnvironmentConfig({ fallthrough: percentRollout(30) }),
          staging: buildEnvironmentConfig(),
          production: buildEnvironmentConfig(),
        },
      });
      if (evaluateFlag(flag, "development", buildContext({ key: `u-${i}` })).variationKey === "on") {
        onCount++;
      }
    }
    expect(onCount).toBeGreaterThan(240);
    expect(onCount).toBeLessThan(360);
  });

  it("uses reason FALLTHROUGH (no bucket) for a single-variation fallthrough", () => {
    const flag = buildFlag({
      environments: {
        development: buildEnvironmentConfig({ fallthrough: fullRollout("on") }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
      },
    });
    const result = evaluateFlag(flag, "development", buildContext());
    expect(result.reason).toBe("FALLTHROUGH");
    expect(result.variationKey).toBe("on");
    expect(result.bucket).toBeUndefined();
  });

  it("buckets independently per flag key so rollouts do not correlate", () => {
    const context = buildContext({ key: "correlated-user" });
    const a = evaluateFlag(
      buildFlag({
        key: "flag-a",
        environments: {
          development: buildEnvironmentConfig({ fallthrough: percentRollout(50) }),
          staging: buildEnvironmentConfig(),
          production: buildEnvironmentConfig(),
        },
      }),
      "development",
      context,
    );
    const b = evaluateFlag(
      buildFlag({
        key: "flag-b",
        environments: {
          development: buildEnvironmentConfig({ fallthrough: percentRollout(50) }),
          staging: buildEnvironmentConfig(),
          production: buildEnvironmentConfig(),
        },
      }),
      "development",
      context,
    );
    // Same user, same percentage, different flag keys — buckets should differ.
    expect(a.bucket).not.toBe(b.bucket);
  });
});

describe("evaluateAllFlags", () => {
  it("evaluates every flag against one context", () => {
    const flags = [
      buildFlag({ key: "flag-1" }),
      buildFlag({ key: "flag-2" }),
    ];
    const results = evaluateAllFlags(flags, "production", buildContext());
    expect(results.map((r) => r.flagKey)).toEqual(["flag-1", "flag-2"]);
  });
});
