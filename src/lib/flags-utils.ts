import type {
  Environment,
  EnvironmentConfig,
  EvaluationResult,
  Flag,
  FlagKind,
  VariationValue,
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

const KIND_LABELS: Record<FlagKind, string> = {
  boolean: "Boolean",
  multivariate: "Multivariate",
};

/** A human label for a flag's kind, for the badge on each flag card. */
export function kindLabel(kind: FlagKind): string {
  return KIND_LABELS[kind];
}

/** The pill tone for a served value: on/off for booleans, partial otherwise. */
export function valueTone(value: VariationValue): StatusTone {
  if (value === true) return "on";
  if (value === false) return "off";
  return "partial";
}

/**
 * A plain-English explanation of why a flag resolved the way it did for one
 * user. Powers the "why" line on each flag card once a test user is set. No
 * jargon: a rollout is framed as a dice roll landing on the served value.
 */
export function describeReason(
  flag: Flag,
  environment: Environment,
  result: EvaluationResult,
): string {
  switch (result.reason) {
    case "OFF":
      return "This flag is switched off here, so everyone gets the default.";
    case "RULE_MATCH": {
      const config = flag.environments[environment];
      const rule =
        result.ruleIndex !== undefined
          ? config?.rules[result.ruleIndex]
          : undefined;
      return rule
        ? `Matched the rule "${rule.description}".`
        : "Matched a targeting rule.";
    }
    case "FALLTHROUGH":
      return "No rules matched, so everyone here gets the same value.";
    case "FALLTHROUGH_ROLLOUT": {
      const served = variationName(flag, result.variationKey);
      return result.bucket !== undefined
        ? `No rules matched. This user's dice roll landed at ${Math.round(
            result.bucket,
          )} of 100, so they get ${served}.`
        : `No rules matched, so the rollout decided: ${served}.`;
    }
  }
}
