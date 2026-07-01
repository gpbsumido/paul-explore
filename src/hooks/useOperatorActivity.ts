"use client";

import { useQuery } from "@tanstack/react-query";
import type { ActivityEvent } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";

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
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.operator.activity(storeId),
    queryFn: async ({ signal }): Promise<ActivityEvent[]> => {
      const res = await fetch(`/api/operator/stores/${storeId}/activity`, {
        signal,
      });
      if (!res.ok) throw new Error("Failed to fetch activity");
      const json = await res.json();
      return json.events as ActivityEvent[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return {
    events: data ?? [],
    loading: isLoading || isFetching,
    error: isError
      ? queryError instanceof Error
        ? queryError.message
        : "Failed to load activity."
      : null,
  };
}
