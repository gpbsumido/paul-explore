// The BFF layer for the flags console. It prefers the live portfolio_api
// feature-flags service and falls back to the in-memory seed store when the
// service is unreachable, so the console keeps working (and looks identical)
// whether or not the backend is deployed.

import {
  fetchFlagsFromApi,
  fetchAuditFromApi,
  patchFlagOnApi,
  FlagsApiError,
  FlagsContractError,
  type FlagWriteAuth,
} from "@/lib/flags-client";
import {
  getFlag,
  getFlags,
  getAudit,
  setFlagEnabled,
  setFallthrough,
} from "@/lib/flags-data";
import { ENVIRONMENTS } from "@/types/flags";
import type {
  AuditEntry,
  Environment,
  Flag,
  UpdateFlagBody,
} from "@/types/flags";

/** Where a payload came from, so the console can be honest about persistence. */
export type Source = "api" | "seed";

export type Fleet = {
  flags: Flag[];
  environments: Environment[];
  source: Source;
};

/** The fleet from the live API, falling back to the seed when it is down. */
export async function loadFleet(): Promise<Fleet> {
  try {
    const { flags, environments } = await fetchFlagsFromApi();
    return { flags, environments, source: "api" };
  } catch {
    return {
      flags: [...getFlags()],
      environments: [...ENVIRONMENTS],
      source: "seed",
    };
  }
}

export type AuditLog = {
  audit: AuditEntry[];
  source: Source;
};

/** The audit log from the live API, falling back to the seed when it is down. */
export async function loadAuditLog(): Promise<AuditLog> {
  try {
    const { audit } = await fetchAuditFromApi();
    return { audit, source: "api" };
  } catch {
    return { audit: [...getAudit()], source: "seed" };
  }
}

export type PatchOutcome = {
  status: number;
  flag?: Flag;
};

/**
 * Applies a flag update. Writes through to the live API when it answers; a real
 * error status (a signed-out 401, an unknown-flag 404) is propagated to the
 * caller. Only a genuine connection failure falls back to the seed store, so
 * the demo keeps working while the backend is not yet deployed.
 */
export async function applyFlagPatch(
  flagKey: string,
  body: UpdateFlagBody,
  auth?: FlagWriteAuth,
): Promise<PatchOutcome> {
  try {
    const { flag } = await patchFlagOnApi(flagKey, body, auth);
    return { status: 200, flag };
  } catch (err) {
    if (err instanceof FlagsApiError) return { status: err.status };
    // The API answered with something unreadable. That is a real problem, and
    // answering it from the seed store would report success for a write that
    // may never have landed -- which is exactly how a response-shape mismatch
    // went unnoticed while every write quietly stopped reaching the API.
    if (err instanceof FlagsContractError) {
      console.error("[flags] unreadable response patching flag", flagKey, err);
      return { status: 502 };
    }
    // Anything left is the API not answering at all, which the seed store can
    // stand in for so the demo keeps working.
    return patchSeedStore(flagKey, body);
  }
}

/**
 * Mirrors the API's PATCH semantics against the in-memory seed store.
 *
 * Exported because the open tier writes here and nowhere else: the API
 * authorizes every write on a bearer token, so a flag anyone may change
 * without signing in has no way to reach it. Keeping those in the seed store
 * is what makes "open to everyone" true rather than aspirational, and it
 * matches what that tier already promises — ephemeral, resets on a cadence,
 * gates nothing real.
 */
export function patchSeedStore(flagKey: string, body: UpdateFlagBody): PatchOutcome {
  if (!getFlag(flagKey)) return { status: 404 };

  const { environment, enabled, fallthrough } = body;
  let updated: Flag | undefined;
  if (enabled !== undefined) {
    updated = setFlagEnabled(flagKey, environment, enabled);
  }
  if (fallthrough !== undefined) {
    updated = setFallthrough(flagKey, environment, fallthrough);
  }

  if (!updated) return { status: 404 };
  return { status: 200, flag: updated };
}
