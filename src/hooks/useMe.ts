"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

/** The session as /api/me reports it. Signed out is `sub: null`. */
export type Me = {
  name: string | null;
  email: string | null;
  sub: string | null;
  isFlagAdmin: boolean;
};

/** A string or null, with a missing optional field read as null. */
function optionalString(field: unknown, key: string): string | null {
  if (field === undefined || field === null) return null;
  if (typeof field === "string") return field;
  throw new Error(`/api/me sent a ${typeof field} for ${key}`);
}

/**
 * Checks the body by hand rather than with zod. This hook sits under the
 * header on every page, and pulling zod in with it put the landing over its
 * bundle budget for four fields.
 */
function parseMe(body: unknown): Me {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error("/api/me didn't send a session object");
  }
  // Narrowed to a non-array object above; reading unknown keys off it is safe.
  const fields = body as Record<string, unknown>;
  if (fields.sub !== null && typeof fields.sub !== "string") {
    throw new Error("/api/me sent no sub");
  }
  const isFlagAdmin = fields.isFlagAdmin ?? false;
  if (typeof isFlagAdmin !== "boolean") {
    throw new Error("/api/me sent a non-boolean isFlagAdmin");
  }
  return {
    name: optionalString(fields.name, "name"),
    email: optionalString(fields.email, "email"),
    sub: fields.sub,
    isFlagAdmin,
  };
}

/**
 * /api/me answers 200 for a signed-out visitor too, so a non-ok response is
 * always a failure. It throws rather than resolving to signed out: this key is
 * shared by the header, the hubs and every gated page, and a cached "signed
 * out" would be wrong for all of them at once.
 */
async function fetchMe(): Promise<Me> {
  const res = await fetch("/api/me");
  if (!res.ok) throw new Error(`Couldn't check the session (${res.status})`);
  return parseMe(await res.json());
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
