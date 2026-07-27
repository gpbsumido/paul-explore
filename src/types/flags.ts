import type { z } from "zod";
import type {
  environmentSchema,
  flagKindSchema,
  variationValueSchema,
  variationSchema,
  clauseSchema,
  targetingRuleSchema,
  rolloutWeightSchema,
  environmentConfigSchema,
  flagSchema,
  evaluationContextSchema,
  evaluationReasonSchema,
  evaluationResultSchema,
  updateFlagBodySchema,
  evaluateBodySchema,
} from "@/lib/flags-schemas";

export type Environment = z.infer<typeof environmentSchema>;
export type FlagKind = z.infer<typeof flagKindSchema>;
export type VariationValue = z.infer<typeof variationValueSchema>;
export type Variation = z.infer<typeof variationSchema>;
export type Clause = z.infer<typeof clauseSchema>;
export type TargetingRule = z.infer<typeof targetingRuleSchema>;
export type RolloutWeight = z.infer<typeof rolloutWeightSchema>;
export type EnvironmentConfig = z.infer<typeof environmentConfigSchema>;
export type Flag = z.infer<typeof flagSchema>;

export type EvaluationContext = z.infer<typeof evaluationContextSchema>;
export type EvaluationReason = z.infer<typeof evaluationReasonSchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

export type UpdateFlagBody = z.infer<typeof updateFlagBodySchema>;
export type EvaluateBody = z.infer<typeof evaluateBodySchema>;

/** The ordered list of environments, promoted left to right. */
export const ENVIRONMENTS: readonly Environment[] = [
  "development",
  "staging",
  "production",
];
