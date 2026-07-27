// Client for the portfolio_api feature-flags endpoints. Reads are public; the
// PATCH write is proxied through the BFF, which forwards the visitor's token.
// The response payloads are validated against the same Zod schemas the console
// uses, so a drifting API surfaces as a clear error instead of bad UI state.

import { z } from "zod";
import {
  auditEntrySchema,
  environmentSchema,
  flagSchema,
  updateFlagBodySchema,
} from "@/lib/flags-schemas";
import type { Flag, UpdateFlagBody } from "@/types/flags";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const BASE = `${API_URL}/api/feature-flags`;

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
    throw new Error(`feature-flags API responded ${res.status}`);
  }
  return flagsPayloadSchema.parse(await res.json());
}

/** Reads the newest-first audit log from the feature-flags API. */
export async function fetchAuditFromApi(): Promise<
  z.infer<typeof auditPayloadSchema>
> {
  const res = await fetch(`${BASE}/audit`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`feature-flags audit API responded ${res.status}`);
  }
  return auditPayloadSchema.parse(await res.json());
}

/**
 * Updates a flag's per-environment config. The optional bearer token is
 * forwarded from the signed-in visitor so the API can authorize the write and
 * attribute the audit entry to them.
 */
export async function patchFlagOnApi(
  flagKey: string,
  body: UpdateFlagBody,
  token?: string,
): Promise<{ flag: Flag }> {
  const res = await fetch(`${BASE}/${flagKey}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(updateFlagBodySchema.parse(body)),
  });
  if (!res.ok) {
    throw new Error(`feature-flags API responded ${res.status}`);
  }
  return flagPayloadSchema.parse(await res.json());
}
