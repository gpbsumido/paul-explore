import type {
  Environment,
  EnvironmentConfig,
  EvaluationResult,
  Flag,
} from "@/types/flags";

// ---------------------------------------------------------------------------
// Pure display helpers for the flags console. Kept out of the components so the
// labels and derived numbers can be unit tested directly.
// ---------------------------------------------------------------------------

export type StatusTone = "off" | "on" | "partial";

export type FlagStatus = {
  label: string;
  tone: StatusTone;
};

/** Whether the config has any targeting rules. */
export function hasTargeting(config: EnvironmentConfig): boolean {
  return config.rules.length > 0;
}

/**
 * The share of fallthrough traffic that receives a non-default value, as a
 * whole percentage. For a boolean flag this is the "on" percentage; for a
 * multivariate flag it is the traffic not landing on the off variation.
 */
export function exposurePercent(config: EnvironmentConfig): number {
  return config.fallthrough
    .filter((slice) => slice.variation !== config.offVariation)
    .reduce((sum, slice) => sum + slice.weight, 0);
}

/** A short status pill for a flag in one environment. */
export function statusOf(config: EnvironmentConfig): FlagStatus {
  if (!config.enabled) return { label: "Off", tone: "off" };

  const exposure = exposurePercent(config);
  const targeted = hasTargeting(config);

  if (exposure === 0 && !targeted) return { label: "Off to all", tone: "off" };
  if (exposure === 100 && !targeted) return { label: "Fully on", tone: "on" };
  if (targeted && exposure === 0) return { label: "Targeted", tone: "partial" };
  return { label: "Partial", tone: "partial" };
}

/** Looks up a variation's human name, falling back to its key. */
export function variationName(flag: Flag, key: string): string {
  return flag.variations.find((v) => v.key === key)?.name ?? key;
}

/**
 * A plain-English explanation of why a flag resolved the way it did, using the
 * matched rule's description when a rule fired. Powers the "why" line in the
 * evaluation playground.
 */
export function describeReason(
  flag: Flag,
  environment: Environment,
  result: EvaluationResult,
): string {
  switch (result.reason) {
    case "OFF":
      return "Kill switch is off — serving the default value";
    case "RULE_MATCH": {
      const config = flag.environments[environment];
      const rule =
        result.ruleIndex !== undefined
          ? config?.rules[result.ruleIndex]
          : undefined;
      return rule
        ? `Matched targeting rule: ${rule.description}`
        : "Matched a targeting rule";
    }
    case "FALLTHROUGH":
      return "Default rollout — everyone gets the same variation";
    case "FALLTHROUGH_ROLLOUT":
      return result.bucket !== undefined
        ? `Percentage rollout — landed in bucket ${result.bucket.toFixed(1)}`
        : "Percentage rollout";
  }
}
