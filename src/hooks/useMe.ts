"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { queryKeys } from "@/lib/queryKeys";

const meSchema = z.object({
  name: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  sub: z.string().nullable(),
  isFlagAdmin: z.boolean().default(false),
});

/** The session as /api/me reports it. Signed out is `sub: null`. */
export type Me = z.infer<typeof meSchema>;

/**
 * /api/me answers 200 for a signed-out visitor too, so a non-ok response is
 * always a failure. It throws rather than resolving to signed out: this key is
 * shared by the header, the hubs and every gated page, and a cached "signed
 * out" would be wrong for all of them at once.
 */
async function fetchMe(): Promise<Me> {
  const res = await fetch("/api/me");
  if (!res.ok) throw new Error(`Couldn't check the session (${res.status})`);
  return meSchema.parse(await res.json());
}

type UseMeOptions = {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean | "always";
};

/** The one place the app asks who's signed in. */
export function useMe({
  enabled = true,
  refetchOnWindowFocus = true,
}: UseMeOptions = {}) {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: fetchMe,
    staleTime: 5 * 60_000,
    enabled,
    refetchOnWindowFocus,
  });
}
