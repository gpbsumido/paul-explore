"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchScanCases, type ScanCase } from "./scans";

const NONE: readonly ScanCase[] = [];

/**
 * The real scans from the manifest. Empty while it loads or if it can't be
 * read, so the phantoms always work and scans join them when they arrive.
 * `initial` is what the server already read, so a page can start with them;
 * an empty one is ignored, so a server that couldn't read the manifest still
 * leaves the browser to try.
 */
export function useScanCases(initial?: readonly ScanCase[]): { scans: readonly ScanCase[]; isPending: boolean; isError: boolean } {
  const query = useQuery({
    queryKey: queryKeys.evar.scanManifest(),
    queryFn: ({ signal }) => fetchScanCases(signal),
    staleTime: 10 * 60_000,
    initialData: initial && initial.length > 0 ? [...initial] : undefined,
  });
  return { scans: query.data ?? NONE, isPending: query.isPending, isError: query.isError };
}
