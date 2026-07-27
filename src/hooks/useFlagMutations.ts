"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type {
  Environment,
  EvaluateBody,
  EvaluationResult,
  Flag,
  RolloutWeight,
  UpdateFlagBody,
} from "@/types/flags";
import { queryKeys } from "@/lib/queryKeys";
import { flagSchema, evaluationResultSchema } from "@/lib/flags-schemas";

// ---------------------------------------------------------------------------
// Toggle / rollout mutations
// ---------------------------------------------------------------------------

type UpdateInput = {
  flagKey: string;
  environment: Environment;
  enabled?: boolean;
  fallthrough?: RolloutWeight[];
};

/** Applies a config change to a single flag's environment inside a flag list. */
function applyUpdate(flags: Flag[], input: UpdateInput): Flag[] {
  return flags.map((flag) => {
    if (flag.key !== input.flagKey) return flag;
    const config = flag.environments[input.environment];
    if (!config) return flag;
    return {
      ...flag,
      environments: {
        ...flag.environments,
        [input.environment]: {
          ...config,
          ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
          ...(input.fallthrough !== undefined
            ? { fallthrough: input.fallthrough }
            : {}),
        },
      },
    };
  });
}

export interface UseUpdateFlagReturn {
  updateFlag: (input: UpdateInput) => Promise<Flag>;
  pendingKey: string | null;
}

/**
 * Mutation that toggles a flag or changes its rollout in one environment.
 *
 * The flag list is optimistically patched so the switch or slider reflects the
 * change instantly. On error the pre-mutation snapshot is restored; on settle
 * the list and audit log are invalidated so the server's version wins.
 */
export function useUpdateFlag(): UseUpdateFlagReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: UpdateInput): Promise<Flag> => {
      const { flagKey, environment, enabled, fallthrough } = input;
      const body: UpdateFlagBody = { environment, enabled, fallthrough };
      const res = await fetch(`/api/flags/${flagKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update flag");
      const json = await res.json();
      return flagSchema.parse(json.flag);
    },

    onMutate: async (input) => {
      const key = queryKeys.flags.list();
      await queryClient.cancelQueries({ queryKey: key });
      const snapshot = queryClient.getQueryData<Flag[]>(key);
      queryClient.setQueryData<Flag[]>(key, (prev) =>
        applyUpdate(prev ?? [], input),
      );
      return { snapshot, key };
    },

    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(context.key, context.snapshot);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flags.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.flags.audit() });
    },
  });

  return {
    updateFlag: (input) => mutation.mutateAsync(input),
    pendingKey: mutation.isPending ? (mutation.variables?.flagKey ?? null) : null,
  };
}

// ---------------------------------------------------------------------------
// Evaluation playground
// ---------------------------------------------------------------------------

export interface UseEvaluateFlagsReturn {
  evaluate: (input: EvaluateBody) => Promise<EvaluationResult[]>;
  results: EvaluationResult[] | null;
  isEvaluating: boolean;
  error: string | null;
}

/**
 * Runs every flag against a user context via the evaluate endpoint. This is a
 * mutation rather than a query because it is triggered by an explicit "run"
 * action and the input is a request body, not a cache key.
 */
export function useEvaluateFlags(): UseEvaluateFlagsReturn {
  const mutation = useMutation({
    mutationFn: async (input: EvaluateBody): Promise<EvaluationResult[]> => {
      const res = await fetch("/api/flags/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to evaluate flags");
      const json = await res.json();
      return z.array(evaluationResultSchema).parse(json.results);
    },
  });

  return {
    // mutateAsync keeps a stable identity across renders, so callers can safely
    // list `evaluate` in an effect's dependency array to auto-run it.
    evaluate: mutation.mutateAsync,
    results: mutation.data ?? null,
    isEvaluating: mutation.isPending,
    error: mutation.isError ? "Evaluation failed. Try again." : null,
  };
}
