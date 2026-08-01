"use client";

import { useQuery } from "@tanstack/react-query";
import type { Sale } from "@/types/operator";
import { queryKeys } from "@/lib/queryKeys";
import { saleSchema } from "@/lib/operator-schemas";
import { z } from "zod";

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
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.operator.sales(storeId),
    queryFn: async ({ signal }): Promise<Sale[]> => {
      const res = await fetch(`/api/operator/stores/${storeId}/sales`, {
        signal,
      });
      if (!res.ok) throw new Error("Failed to fetch sales");
      const json = await res.json();
      return z.array(saleSchema).parse(json.sales);
    },
    staleTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  return {
    sales: data ?? EMPTY,
    loading: isLoading,
    error: isError
      ? queryError instanceof Error
        ? queryError.message
        : "Failed to load sales."
      : null,
  };
}
