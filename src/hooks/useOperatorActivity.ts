"use client";

import type { ActivityEvent } from "@/types/operator";
import { z } from "zod";
import { activityEventSchema } from "@/lib/operator-schemas";
import { queryKeys } from "@/lib/queryKeys";
import { useOperatorResource } from "./useOperatorResource";

const EMPTY: ActivityEvent[] = [];

export interface UseOperatorActivityReturn {
  events: ActivityEvent[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches activity events for a specific operator store.
 *
 * No polling — activity is historical and doesn't change as frequently as
 * alerts or inventory. Refetches on window focus for freshness.
 */
export function useOperatorActivity(
  storeId: string,
): UseOperatorActivityReturn {
  const { data, loading, error } = useOperatorResource<ActivityEvent>({
    queryKey: queryKeys.operator.activity(storeId),
    url: `/api/operator/stores/${storeId}/activity`,
    select: (json) =>
      z.object({ events: z.array(activityEventSchema) }).parse(json).events,
    fetchError: "Failed to fetch activity",
    loadError: "Failed to load activity.",
  });

  return { events: data ?? EMPTY, loading, error };
}
