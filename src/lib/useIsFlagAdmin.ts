"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Whether the signed-in user is a flag admin, read from `/api/me`. Shares the
 * `["me"]` query key (and cache) with the header and the flags console, so it
 * adds no extra request on a page that already probes the session.
 *
 * A hint for rendering only — every privileged route re-derives admin from the
 * session server-side, so a tampered response only changes what the UI draws.
 */
export function useIsFlagAdmin(): boolean {
  const { data } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<{ isFlagAdmin?: boolean }> =>
      fetch("/api/me").then((r) => {
        if (!r.ok) throw new Error("Failed to load user");
        return r.json();
      }),
    staleTime: 5 * 60_000,
  });
  return data?.isFlagAdmin === true;
}
