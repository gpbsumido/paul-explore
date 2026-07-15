"use client";

import { useQuery } from "@tanstack/react-query";
import type { Alert } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";
import { alertSchema } from "@/lib/operator-schemas";
import { z } from "zod";

const EMPTY: Alert[] = [];

export interface UseOperatorAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches alerts for a specific operator store.
 *
 * Polls every 15 seconds — alerts are the most time-sensitive data on the
 * dashboard. A critical alert (temperature spike, power issue) needs to
 * surface within seconds, not minutes.
 */
export function useOperatorAlerts(storeId: string): UseOperatorAlertsReturn {
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.operator.alerts(storeId),
    queryFn: async ({ signal }): Promise<Alert[]> => {
      const res = await fetch(`/api/operator/stores/${storeId}/alerts`, {
        signal,
      });
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const json = await res.json();
      return z.array(alertSchema).parse(json.alerts);
    },
    staleTime: 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  return {
    alerts: data ?? EMPTY,
    loading: isLoading,
    error: isError
      ? queryError instanceof Error
        ? queryError.message
        : "Failed to load alerts."
      : null,
  };
}
