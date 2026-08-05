"use client";

import type { PlanogramSlot } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";
import { planogramSlotSchema } from "@/lib/operator-schemas";
import { z } from "zod";
import { useOperatorResource } from "./useOperatorResource";

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
  const { data, loading, error } = useOperatorResource<PlanogramSlot>({
    queryKey: queryKeys.operator.planogram(storeId),
    url: `/api/operator/stores/${storeId}/planogram`,
    select: (json) =>
      z.object({ slots: z.array(planogramSlotSchema) }).parse(json).slots,
    fetchError: "Failed to fetch planogram",
    loadError: "Failed to load planogram.",
    refetchInterval: 60_000,
  });

  return { slots: data ?? EMPTY, loading, error };
}
