// Server-side gate for a real, visible feature. The /tcg/pocket experience is
// rendered on or off per visitor by evaluating the pocket-tcg flag against a
// stable first-party visitor key, so a percentage rollout is sticky for that
// visitor and the decision is made server-side (no client flicker).

import { evaluateFlag } from "@/lib/flags-engine";
import { loadFleet } from "@/lib/flags-bff";
import { getFlag } from "@/lib/flags-data";
import type { Environment, Flag } from "@/types/flags";

/** The flag that gates the Pokémon TCG Pocket experience. */
export const POCKET_TCG_FLAG = "pocket-tcg";

/** Real visitors see the site's production environment. */
const GATE_ENVIRONMENT: Environment = "production";

/**
 * Whether a flag serves the on variation for this visitor. A missing flag fails
 * open — a config gap must never hide a feature that otherwise works.
 */
export function isFeatureEnabled(
  flag: Flag | undefined,
  environment: Environment,
  visitorKey: string,
): boolean {
  if (!flag) return true;
  const result = evaluateFlag(flag, environment, {
    key: visitorKey,
    attributes: {},
  });
  return result.value === true;
}

/** Where the gating flag was resolved from, for honest diagnostics. */
export type GateSource = "api" | "seed" | "default";

export type GateDecision = {
  enabled: boolean;
  source: GateSource;
};

/**
 * Loads the pocket-tcg flag — preferring the live API fleet, then the local
 * seed — and evaluates it for the given visitor. Falls open to enabled when the
 * flag exists nowhere, so a deploy that has not yet seeded it stays usable.
 */
export async function loadPocketGate(
  visitorKey: string,
  environment: Environment = GATE_ENVIRONMENT,
): Promise<GateDecision> {
  const fleet = await loadFleet();
  const fromFleet = fleet.flags.find((f) => f.key === POCKET_TCG_FLAG);
  const flag = fromFleet ?? getFlag(POCKET_TCG_FLAG);
  const source: GateSource = fromFleet ? fleet.source : flag ? "seed" : "default";
  return {
    enabled: isFeatureEnabled(flag, environment, visitorKey),
    source,
  };
}
