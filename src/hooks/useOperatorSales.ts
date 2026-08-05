"use client";

import type { Sale } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";
import { saleSchema } from "@/lib/operator-schemas";
import { z } from "zod";
import { useOperatorResource } from "./useOperatorResource";

const EMPTY: Sale[] = [];

export interface UseOperatorSalesReturn {
  sales: Sale[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches sales history for a specific operator store.
 *
 * Polls every 60 seconds — sales trickle in at roughly the same cadence as
 * inventory drawdown, so the two share a polling tier.
 */
export function useOperatorSales(storeId: string): UseOperatorSalesReturn {
  const { data, loading, error } = useOperatorResource<Sale>({
    queryKey: queryKeys.operator.sales(storeId),
    url: `/api/operator/stores/${storeId}/sales`,
    select: (json) =>
      z.object({ sales: z.array(saleSchema) }).parse(json).sales,
    fetchError: "Failed to fetch sales",
    loadError: "Failed to load sales.",
    refetchInterval: 60_000,
  });

  return { sales: data ?? EMPTY, loading, error };
}
