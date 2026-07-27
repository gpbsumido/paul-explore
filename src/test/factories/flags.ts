import type {
  Clause,
  EnvironmentConfig,
  EvaluationContext,
  Flag,
  RolloutWeight,
  TargetingRule,
  Variation,
} from "@/types/flags";

// ---------------------------------------------------------------------------
// Factory functions for feature-flag test data. Every helper returns real
// domain types and accepts partial overrides, so a test states only the fields
// it cares about.
// ---------------------------------------------------------------------------

/** Boolean on/off variations, the common case. */
export const BOOLEAN_VARIATIONS: readonly Variation[] = [
  { key: "on", name: "Enabled", value: true },
  { key: "off", name: "Disabled", value: false },
];

export function buildClause(overrides: Partial<Clause> = {}): Clause {
  return {
    attribute: "plan",
    op: "in",
    values: ["enterprise"],
    ...overrides,
  };
}

export function buildRule(overrides: Partial<TargetingRule> = {}): TargetingRule {
  return {
    id: "rule-1",
    description: "Enterprise plans",
    clauses: [buildClause()],
    serve: "on",
    ...overrides,
  };
}

/** A fallthrough that serves a single variation to everyone. */
export function fullRollout(variation: string): RolloutWeight[] {
  return [{ variation, weight: 100 }];
}

/** A two-way rollout: `onPercent` to "on", the rest to "off". */
export function percentRollout(onPercent: number): RolloutWeight[] {
  return [
    { variation: "on", weight: onPercent },
    { variation: "off", weight: 100 - onPercent },
  ];
}

export function buildEnvironmentConfig(
  overrides: Partial<EnvironmentConfig> = {},
): EnvironmentConfig {
  return {
    enabled: true,
    offVariation: "off",
    rules: [],
    fallthrough: fullRollout("off"),
    ...overrides,
  };
}

export function buildFlag(overrides: Partial<Flag> = {}): Flag {
  const base: Flag = {
    key: "new-checkout",
    name: "New Checkout",
    description: "Rebuilt checkout flow",
    kind: "boolean",
    tags: ["checkout"],
    variations: [...BOOLEAN_VARIATIONS],
    createdAt: "2026-01-01T00:00:00.000Z",
    environments: {
      development: buildEnvironmentConfig(),
      staging: buildEnvironmentConfig(),
      production: buildEnvironmentConfig(),
    },
  };
  return { ...base, ...overrides };
}

export function buildContext(
  overrides: Partial<EvaluationContext> = {},
): EvaluationContext {
  return {
    key: "user-123",
    attributes: {},
    ...overrides,
  };
}
