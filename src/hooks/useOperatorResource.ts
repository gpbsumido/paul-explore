"use client";

import { useQuery, type QueryKey } from "@tanstack/react-query";

export interface UseOperatorResourceOptions<T> {
  /** React Query cache key for this resource. */
  queryKey: QueryKey;
  /** Endpoint to fetch. */
  url: string;
  /** Validates the raw JSON and pulls out the array this resource returns. */
  select: (json: unknown) => T[];
  /** Message thrown when the response is not ok (surfaces as `error`). */
  fetchError: string;
  /** Fallback `error` text when the thrown value isn't an Error. */
  loadError: string;
  /** Polling interval in ms. Omit for read-once resources (e.g. activity). */
  refetchInterval?: number;
}

export interface UseOperatorResourceReturn<T> {
  data: T[] | undefined;
  loading: boolean;
  error: string | null;
}

/**
 * The shared shape every operator read hook repeated: fetch an endpoint, throw
 * on a bad response, validate the JSON through a Zod schema, and expose
 * `{ data, loading, error }`. Each hook wraps this with its own return key,
 * schema, and polling tier — the plumbing lives here once.
 */
export function useOperatorResource<T>({
  queryKey,
  url,
  select,
  fetchError,
  loadError,
  refetchInterval,
}: UseOperatorResourceOptions<T>): UseOperatorResourceReturn<T> {
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async ({ signal }): Promise<T[]> => {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(fetchError);
      return select(await res.json());
    },
    staleTime: 0,
    refetchInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  return {
    data,
    loading: isLoading,
    error: isError ? (error instanceof Error ? error.message : loadError) : null,
  };
}
