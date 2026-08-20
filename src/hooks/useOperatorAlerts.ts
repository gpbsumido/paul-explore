"use client";

import type { Alert } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";
import { alertSchema } from "@/lib/operator-schemas";
import { z } from "zod";
import { useOperatorResource } from "./useOperatorResource";

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
  const { data, loading, error } = useOperatorResource<Alert>({
    queryKey: queryKeys.operator.alerts(storeId),
    url: `/api/operator/stores/${storeId}/alerts`,
    select: (json) =>
      z.object({ alerts: z.array(alertSchema) }).parse(json).alerts,
    fetchError: "Failed to fetch alerts",
    loadError: "Failed to load alerts.",
    refetchInterval: 15_000,
  });

  return { alerts: data ?? EMPTY, loading, error };
}
