"use client";

import { useQuery } from "@tanstack/react-query";
import type { PlanogramSlot } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";
import { planogramSlotSchema } from "@/lib/operator-schemas";
import { z } from "zod";

const EMPTY: PlanogramSlot[] = [];

export interface UseOperatorPlanogramReturn {
  slots: PlanogramSlot[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the persisted planogram layout (slot order + sensor flags) for a
 * store. Polls every 60 seconds like inventory; operator edits apply
 * optimistically on top.
 */
export function useOperatorPlanogram(
  storeId: string,
): UseOperatorPlanogramReturn {
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.operator.planogram(storeId),
    queryFn: async ({ signal }): Promise<PlanogramSlot[]> => {
      const res = await fetch(`/api/operator/stores/${storeId}/planogram`, {
        signal,
      });
      if (!res.ok) throw new Error("Failed to fetch planogram");
      const json = await res.json();
      return z.array(planogramSlotSchema).parse(json.slots);
    },
    staleTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  return {
    slots: data ?? EMPTY,
    loading: isLoading,
    error: isError
      ? queryError instanceof Error
        ? queryError.message
        : "Failed to load planogram."
      : null,
  };
}
