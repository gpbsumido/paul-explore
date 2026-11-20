"use client";

import { useMe } from "@/hooks/useMe";

/**
 * Whether the signed-in user is a flag admin, read from `/api/me`. Shares the
 * `["me"]` query key (and cache) with the header and the flags console, so it
 * adds no extra request on a page that already probes the session.
 *
 * A hint for rendering only — every privileged route re-derives admin from the
 * session server-side, so a tampered response only changes what the UI draws.
 */
export function useIsFlagAdmin(): boolean {
  const { data } = useMe();
  return data?.isFlagAdmin === true;
}
