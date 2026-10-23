"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchScanCases, type ScanCase } from "./scans";

const NONE: readonly ScanCase[] = [];

/**
 * The real scans from the manifest. Empty while it loads or if it can't be
 * read, so the phantoms always work and scans join them when they arrive.
 */
export function useScanCases(): { scans: readonly ScanCase[]; isPending: boolean; isError: boolean } {
  const query = useQuery({
    queryKey: queryKeys.evar.scanManifest(),
    queryFn: ({ signal }) => fetchScanCases(signal),
    staleTime: 10 * 60_000,
  });
  return { scans: query.data ?? NONE, isPending: query.isPending, isError: query.isError };
}
