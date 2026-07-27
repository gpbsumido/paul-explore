import type {
  Clause,
  Environment,
  EnvironmentConfig,
  EvaluationContext,
  EvaluationResult,
  Flag,
  RolloutWeight,
  Variation,
} from "@/types/flags";

// ---------------------------------------------------------------------------
// Pure feature-flag evaluation engine.
//
// Nothing here touches the network, the clock, or global state — the same
// (flag, environment, context) always produces the same result. That is what
// makes rollouts sticky per user and lets the console explain every decision.
// ---------------------------------------------------------------------------

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const UINT32 = 2 ** 32;

/**
 * Spreads the bits of a 32-bit hash so small input differences scatter across
 * the whole range. FNV-1a alone leaves sequential keys (user-1, user-2, ...)
 * clustered; this murmur3 finalizer gives the output the avalanche property a
 * fair rollout needs.
 */
function avalanche(hash: number): number {
  let h = hash;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h;
}

/**
 * Hashes a seed string to a stable bucket in [0, 100) using FNV-1a plus an
 * avalanche step. A given seed always maps to the same bucket, and the output
 * spreads evenly across the range, so a percentage rollout keyed on
 * `${flagKey}:${userKey}` assigns each user a fixed slot that only ever grows
 * as the rollout widens.
 */
export function bucketFor(seed: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  // >>> 0 coerces to an unsigned 32-bit int before normalizing to [0, 100).
  return ((avalanche(hash) >>> 0) / UINT32) * 100;
}

/** Reads a context attribute as a string. "key" reads the context key itself. */
function readAttribute(
  context: EvaluationContext,
  attribute: string,
): string | undefined {
  if (attribute === "key") return context.key;
  const value = context.attributes[attribute];
  return value === undefined ? undefined : String(value);
}

/** Whether a single clause matches the context. Missing attributes never match positive ops. */
function clauseMatches(clause: Clause, context: EvaluationContext): boolean {
  const actual = readAttribute(context, clause.attribute);

  if (clause.op === "notIn") {
    return actual === undefined || !clause.values.includes(actual);
  }
  if (actual === undefined) return false;

  switch (clause.op) {
    case "in":
      return clause.values.includes(actual);
    case "equals":
      return actual === clause.values[0];
    case "contains":
      return clause.values.some((v) => actual.includes(v));
    case "startsWith":
      return clause.values.some((v) => actual.startsWith(v));
    case "endsWith":
      return clause.values.some((v) => actual.endsWith(v));
  }
}

/** A rule matches when all of its clauses match (logical AND). */
function ruleMatches(
  clauses: readonly Clause[],
  context: EvaluationContext,
): boolean {
  return clauses.every((clause) => clauseMatches(clause, context));
}

/** Picks the variation whose cumulative weight interval contains the bucket. */
function variationForBucket(
  weights: readonly RolloutWeight[],
  bucket: number,
): string {
  let cumulative = 0;
  for (const slice of weights) {
    cumulative += slice.weight;
    if (bucket < cumulative) return slice.variation;
  }
  // Rounding at the top of the range: fall back to the last configured slice.
  return weights[weights.length - 1].variation;
}

function findVariation(
  variations: readonly Variation[],
  key: string,
): Variation {
  return variations.find((v) => v.key === key) ?? variations[0];
}

function resolve(
  flag: Flag,
  variationKey: string,
  reason: EvaluationResult["reason"],
  extra: { ruleIndex?: number; bucket?: number } = {},
): EvaluationResult {
  const variation = findVariation(flag.variations, variationKey);
  return {
    flagKey: flag.key,
    variationKey: variation.key,
    value: variation.value,
    reason,
    ...extra,
  };
}

/**
 * Evaluates one flag in one environment against a context.
 *
 * Order of precedence: kill switch (off) → targeting rules (first match wins) →
 * fallthrough. A single-variation fallthrough resolves directly; a weighted
 * fallthrough buckets the context deterministically on `${flagKey}:${key}`.
 */
export function evaluateFlag(
  flag: Flag,
  environment: Environment,
  context: EvaluationContext,
): EvaluationResult {
  const config: EnvironmentConfig | undefined = flag.environments[environment];

  if (!config || !config.enabled) {
    return resolve(flag, config?.offVariation ?? flag.variations[0].key, "OFF");
  }

  for (let i = 0; i < config.rules.length; i++) {
    const rule = config.rules[i];
    if (ruleMatches(rule.clauses, context)) {
      return resolve(flag, rule.serve, "RULE_MATCH", { ruleIndex: i });
    }
  }

  if (config.fallthrough.length === 1) {
    return resolve(flag, config.fallthrough[0].variation, "FALLTHROUGH");
  }

  const bucket = bucketFor(`${flag.key}:${context.key}`);
  const variationKey = variationForBucket(config.fallthrough, bucket);
  return resolve(flag, variationKey, "FALLTHROUGH_ROLLOUT", { bucket });
}

/** Evaluates every flag against one context, preserving input order. */
export function evaluateAllFlags(
  flags: readonly Flag[],
  environment: Environment,
  context: EvaluationContext,
): EvaluationResult[] {
  return flags.map((flag) => evaluateFlag(flag, environment, context));
}
