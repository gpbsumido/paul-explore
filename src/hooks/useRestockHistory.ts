"use client";

import type { RestockSession } from "@/types/operator";
import { z } from "zod";
import { restockSessionSchema } from "@/lib/operator-schemas";
import { queryKeys } from "@/lib/queryKeys";
import { useOperatorResource } from "./useOperatorResource";

const EMPTY: RestockSession[] = [];

export interface UseRestockHistoryReturn {
  sessions: RestockSession[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches a store's completed restock sessions, newest first.
 *
 * The endpoint has always returned the full history; nothing rendered it, so
 * the counts that feed the shrink report could not be reviewed after the fact.
 *
 * No polling. A restock is finished by the time it lands here, so there is
 * nothing to keep up with — refetch on focus is enough.
 */
export function useRestockHistory(storeId: string): UseRestockHistoryReturn {
  const { data, loading, error } = useOperatorResource<RestockSession>({
    queryKey: queryKeys.operator.restockHistory(storeId),
    url: `/api/operator/stores/${storeId}/restock-sessions`,
    select: (json) =>
      z.object({ sessions: z.array(restockSessionSchema) }).parse(json).sessions,
    fetchError: "Failed to fetch restock history",
    loadError: "Failed to load restock history.",
  });

  return { sessions: data ?? EMPTY, loading, error };
}
