// Client for the portfolio_api feature-flags endpoints. Reads are public; the
// PATCH write is proxied through the BFF, which forwards the visitor's token.
// The response payloads are validated against the same Zod schemas the console
// uses, so a drifting API surfaces as a clear error instead of bad UI state.

import { z } from "zod";
import { API_URL } from "@/lib/apiUrl";
import {
  auditEntrySchema,
  environmentSchema,
  flagSchema,
  updateFlagBodySchema,
} from "@/lib/flags-schemas";
import type { Flag, UpdateFlagBody } from "@/types/flags";

const BASE = `${API_URL}/api/feature-flags`;

/**
 * The API answered, but with a non-2xx status. Distinct from a thrown fetch
 * (the API being unreachable) so the BFF can fall back to the seed only when
 * the service is truly down, while propagating a real 401/404 to the caller.
 */
export class FlagsApiError extends Error {
  constructor(readonly status: number) {
    super(`feature-flags API responded ${status}`);
    this.name = "FlagsApiError";
  }
}

const flagsPayloadSchema = z.object({
  flags: z.array(flagSchema),
  environments: z.array(environmentSchema),
});

const auditPayloadSchema = z.object({
  audit: z.array(auditEntrySchema),
});

const flagPayloadSchema = z.object({
  flag: flagSchema,
});

/** Reads the whole fleet and the environment list from the feature-flags API. */
export async function fetchFlagsFromApi(): Promise<
  z.infer<typeof flagsPayloadSchema>
> {
  const res = await fetch(BASE, { cache: "no-store" });
  if (!res.ok) {
    throw new FlagsApiError(res.status);
  }
  return flagsPayloadSchema.parse(await res.json());
}

/** Reads the newest-first audit log from the feature-flags API. */
export async function fetchAuditFromApi(): Promise<
  z.infer<typeof auditPayloadSchema>
> {
  const res = await fetch(`${BASE}/audit`, { cache: "no-store" });
  if (!res.ok) {
    throw new FlagsApiError(res.status);
  }
  return auditPayloadSchema.parse(await res.json());
}

/** Header the API reads the BFF's shared secret from. Not a bearer: it is not
 * a JWT and presenting it as one gets it rejected by the user-auth middleware. */
export const FLAGS_TOKEN_HEADER = "x-flags-token";

/**
 * How a write authenticates itself to the API.
 *
 * A visitor's own bearer, or the server's shared secret for the open tier
 * where there is no visitor to borrow one from. They travel in different
 * headers because they are different kinds of credential — the secret is not a
 * JWT, and sending it as a bearer means the user-auth middleware tries to
 * verify it and refuses.
 */
export type FlagWriteAuth =
  | { bearer: string }
  | { serviceToken: string }
  | undefined;

function authHeaders(auth: FlagWriteAuth): Record<string, string> {
  if (!auth) return {};
  if ("bearer" in auth) return { authorization: `Bearer ${auth.bearer}` };
  return { [FLAGS_TOKEN_HEADER]: auth.serviceToken };
}

/**
 * Updates a flag's per-environment config, authenticating with whichever
 * credential the caller has, so the API can authorize the write and attribute
 * the audit entry.
 */
export async function patchFlagOnApi(
  flagKey: string,
  body: UpdateFlagBody,
  auth?: FlagWriteAuth,
): Promise<{ flag: Flag }> {
  const res = await fetch(`${BASE}/${flagKey}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...authHeaders(auth),
    },
    body: JSON.stringify(updateFlagBodySchema.parse(body)),
  });
  if (!res.ok) {
    throw new FlagsApiError(res.status);
  }
  return flagPayloadSchema.parse(await res.json());
}
