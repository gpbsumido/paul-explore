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

  // These are the slots real visitors already hold. If the hash changes, every
  // percentage rollout reshuffles who is in and who is out.
  it.each([
    ["new-checkout:user-42", 71.86199559364468],
    ["pocket-tcg:visitor-1", 70.51317833829671],
    ["dark-mode:abc", 91.74173644278198],
    ["", 66.89221884589642],
  ])("keeps %j in the slot it has always had", (seed, bucket) => {
    expect(bucketFor(seed)).toBeCloseTo(bucket, 10);
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

describe("evaluateFlag — fallbacks", () => {
  const flagWith = (environments: Partial<Record<"development" | "staging" | "production", ReturnType<typeof buildEnvironmentConfig>>>) =>
    buildFlag({
      variations: [
        { key: "first", name: "First", value: "one" },
        { key: "second", name: "Second", value: "two" },
      ],
      environments: {
        development: buildEnvironmentConfig(),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
        ...environments,
      },
    });

  it("serves the first variation when a rule or fallthrough names one that doesn't exist", () => {
    const flag = flagWith({
      development: buildEnvironmentConfig({ fallthrough: fullRollout("deleted-variation") }),
    });
    expect(evaluateFlag(flag, "development", buildContext())).toMatchObject({
      reason: "FALLTHROUGH",
      variationKey: "first",
    });
  });

  it("reports the index of the rule that matched, not just the first", () => {
    const flag = flagWith({
      development: buildEnvironmentConfig({
        rules: [
          buildRule({ id: "r1", serve: "first", clauses: [buildClause({ attribute: "plan", op: "in", values: ["free"] })] }),
          buildRule({ id: "r2", serve: "second", clauses: [buildClause({ attribute: "plan", op: "in", values: ["pro"] })] }),
        ],
        fallthrough: fullRollout("first"),
      }),
    });
    const result = evaluateFlag(flag, "development", buildContext({ attributes: { plan: "pro" } }));
    expect(result).toMatchObject({ reason: "RULE_MATCH", ruleIndex: 1, variationKey: "second", value: "two" });
  });

  it("serves a kill-switched flag's off variation even when a rule would match", () => {
    const flag = flagWith({
      development: buildEnvironmentConfig({
        enabled: false,
        offVariation: "second",
        rules: [buildRule({ serve: "first", clauses: [buildClause({ attribute: "plan", op: "in", values: ["pro"] })] })],
      }),
    });
    const result = evaluateFlag(flag, "development", buildContext({ attributes: { plan: "pro" } }));
    expect(result).toMatchObject({ reason: "OFF", variationKey: "second" });
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

  it.each([
    ["in", ["a", "b"], "b", "on"],
    ["in", ["a", "b"], "c", "off"],
    ["in", ["a"], undefined, "off"],
    ["notIn", ["a", "b"], "c", "on"],
    ["notIn", ["a", "b"], "b", "off"],
    ["notIn", ["a"], undefined, "on"],
    ["equals", ["pro"], "pro", "on"],
    ["equals", ["pro"], "professional", "off"],
    ["equals", ["pro"], undefined, "off"],
    ["contains", ["@acme", "@beta"], "x@beta.io", "on"],
    ["contains", ["@acme", "@beta"], "x@other.io", "off"],
    ["contains", ["@acme"], undefined, "off"],
    ["startsWith", ["beta-", "qa-"], "qa-tester", "on"],
    ["startsWith", ["beta-", "qa-"], "my-beta-", "off"],
    ["endsWith", [".com", ".io"], "sam@x.io", "on"],
    ["endsWith", [".com", ".io"], "sam@x.org", "off"],
  ] as const)("%s %j against %j serves %s", (op, values, actual, served) => {
    const attributes: Record<string, string> = actual === undefined ? {} : { trait: actual };
    expect(evalWith(buildClause({ attribute: "trait", op, values: [...values] }), attributes)).toBe(served);
  });

  it("compares a numeric attribute as text", () => {
    const flag = buildFlag({
      environments: {
        development: buildEnvironmentConfig({
          rules: [
            buildRule({
              serve: "on",
              clauses: [buildClause({ attribute: "seats", op: "in", values: ["25"] })],
            }),
          ],
          fallthrough: fullRollout("off"),
        }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
      },
    });
    const result = evaluateFlag(flag, "development", buildContext({ attributes: { seats: 25 } }));
    expect(result.variationKey).toBe("on");
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

  it("puts a bucket exactly on a slice boundary into the next slice", () => {
    // 71.86... is the stored slot for this key, so a 71.86199559364468% "on" slice
    // ends exactly where the bucket starts.
    const flag = buildFlag({
      key: "new-checkout",
      environments: {
        development: buildEnvironmentConfig({
          fallthrough: [
            { variation: "on", weight: 71.86199559364468 },
            { variation: "off", weight: 100 - 71.86199559364468 },
          ],
        }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
      },
    });
    const result = evaluateFlag(flag, "development", buildContext({ key: "user-42" }));
    expect(result.bucket).toBeCloseTo(71.86199559364468, 10);
    expect(result.variationKey).toBe("off");
  });

  it("serves the last slice when the weights fall short of the bucket", () => {
    // Weights that only add up to 10 can't reach a bucket of ~71.9; the last
    // configured slice takes the overflow rather than serving nothing.
    const flag = buildFlag({
      key: "new-checkout",
      environments: {
        development: buildEnvironmentConfig({
          fallthrough: [
            { variation: "on", weight: 5 },
            { variation: "off", weight: 5 },
          ],
        }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig(),
      },
    });
    const result = evaluateFlag(flag, "development", buildContext({ key: "user-42" }));
    expect(result.variationKey).toBe("off");
  });

  it("walks a three-way rollout in order, so each key lands in the slice holding its bucket", () => {
    const flag = (key: string) =>
      buildFlag({
        key,
        variations: [
          { key: "a", name: "A", value: "a" },
          { key: "b", name: "B", value: "b" },
          { key: "c", name: "C", value: "c" },
        ],
        environments: {
          development: buildEnvironmentConfig({
            fallthrough: [
              { variation: "a", weight: 50 },
              { variation: "b", weight: 25 },
              { variation: "c", weight: 25 },
            ],
          }),
          staging: buildEnvironmentConfig(),
          production: buildEnvironmentConfig(),
        },
      });
    // new-checkout:user-42 holds slot 71.86, inside b's [50, 75); dark-mode:abc
    // holds 91.74, inside c's [75, 100).
    const served = (flagKey: string, userKey: string) =>
      evaluateFlag(flag(flagKey), "development", buildContext({ key: userKey })).variationKey;
    expect(served("new-checkout", "user-42")).toBe("b");
    expect(served("dark-mode", "abc")).toBe("c");
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

  it("evaluates in the environment it was asked for", () => {
    const flag = buildFlag({
      key: "env-flag",
      environments: {
        development: buildEnvironmentConfig({ enabled: false }),
        staging: buildEnvironmentConfig(),
        production: buildEnvironmentConfig({ fallthrough: fullRollout("on") }),
      },
    });
    const [dev] = evaluateAllFlags([flag], "development", buildContext());
    const [prod] = evaluateAllFlags([flag], "production", buildContext());
    expect(dev.reason).toBe("OFF");
    expect(prod).toMatchObject({ reason: "FALLTHROUGH", variationKey: "on" });
  });
});
