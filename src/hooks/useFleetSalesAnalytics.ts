"use client";

import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { queryKeys } from "@/lib/queryKeys";
import { fleetSalesAnalyticsSchema } from "@/lib/operator-schemas";
import type { SalesGranularity } from "@/lib/operator-sales";
import { queryErrorMessage } from "./queryErrorMessage";

export type FleetSalesAnalyticsData = z.infer<
  typeof fleetSalesAnalyticsSchema
>;

export interface UseFleetSalesAnalyticsReturn {
  analytics: FleetSalesAnalyticsData | undefined;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches fleet-wide sales analytics for a granularity. One request aggregates
 * every store server-side, so the dashboard scales to any fleet size. Keyed by
 * granularity so switching ranges caches each view independently.
 */
export function useFleetSalesAnalytics(
  granularity: SalesGranularity,
  timeZone: string,
): UseFleetSalesAnalyticsReturn {
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.operator.salesAnalytics(granularity, timeZone),
    queryFn: async ({ signal }): Promise<FleetSalesAnalyticsData> => {
      const query = new URLSearchParams({ granularity, tz: timeZone });
      const res = await fetch(`/api/operator/sales-analytics?${query}`, {
        signal,
      });
      if (!res.ok) throw new Error("Failed to fetch sales analytics");
      const json = await res.json();
      return fleetSalesAnalyticsSchema.parse(json);
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    analytics: data,
    loading: isLoading,
    error: queryErrorMessage(
      isError,
      queryError,
      "Failed to load sales analytics.",
    ),
  };
}
