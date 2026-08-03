"use client";

import { useQuery } from "@tanstack/react-query";
import type { ActivityEvent } from "@/types/operator";
import { z } from "zod";
import { activityEventSchema } from "@/lib/operator-schemas";
import { queryKeys } from "@/lib/queryKeys";

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
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.operator.activity(storeId),
    queryFn: async ({ signal }): Promise<ActivityEvent[]> => {
      const res = await fetch(`/api/operator/stores/${storeId}/activity`, {
        signal,
      });
      if (!res.ok) throw new Error("Failed to fetch activity");
      // Parsed like every other operator read; this one was casting.
      const { events } = z
        .object({ events: z.array(activityEventSchema) })
        .parse(await res.json());
      return events;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return {
    events: data ?? EMPTY,
    loading: isLoading,
    error: isError
      ? queryError instanceof Error
        ? queryError.message
        : "Failed to load activity."
      : null,
  };
}
