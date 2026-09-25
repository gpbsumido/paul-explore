// Server-side gate for a real, visible feature. The /tcg/pocket experience is
// rendered on or off per visitor by evaluating the pocket-tcg flag against a
// stable first-party visitor key, so a percentage rollout is sticky for that
// visitor and the decision is made server-side (no client flicker).

import { evaluateFlag } from "@/lib/flags-engine";
import { loadFleet, type Fleet } from "@/lib/flags-bff";
import { getFlag } from "@/lib/flags-data";
import type { Environment, Flag } from "@/types/flags";

/** The flag that gates the Pokémon TCG Pocket experience. */
export const POCKET_TCG_FLAG = "pocket-tcg";

/**
 * The flag that moves /work-portfolio from the in-repo copy to the
 * micro-frontend remote. A migration flag, so unlike pocket-tcg it fails
 * closed: a missing flag means the page everyone already has.
 */
export const WORK_PORTFOLIO_REMOTE_FLAG = "work-portfolio-remote";

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

type FlagSources = {
  fleet?: () => Promise<Pick<Fleet, "flags" | "source">>;
  seed?: (key: string) => Flag | undefined;
};

/** A flag from the live API fleet, else the local seed, and where it came from. */
async function resolveFlag(
  key: string,
  { fleet = loadFleet, seed = getFlag }: FlagSources = {},
): Promise<{ flag: Flag | undefined; source: GateSource }> {
  const live = await fleet();
  const fromFleet = live.flags.find((f) => f.key === key);
  const flag = fromFleet ?? seed(key);
  const source: GateSource = fromFleet ? live.source : flag ? "seed" : "default";
  return { flag, source };
}

/**
 * Loads the pocket-tcg flag — preferring the live API fleet, then the local
 * seed — and evaluates it for the given visitor. Falls open to enabled when the
 * flag exists nowhere, so a deploy that has not yet seeded it stays usable.
 */
export async function loadPocketGate(
  visitorKey: string,
  environment: Environment = GATE_ENVIRONMENT,
): Promise<GateDecision> {
  const { flag, source } = await resolveFlag(POCKET_TCG_FLAG);
  return {
    enabled: isFeatureEnabled(flag, environment, visitorKey),
    source,
  };
}

/**
 * Whether this visitor gets the work portfolio from the remote. Same lookup as
 * the pocket gate, but a flag that exists nowhere is off, not on. Sticky per
 * visitor, so a partial rollout never flips someone between the two builds.
 */
export async function loadWorkPortfolioRemoteGate(
  visitorKey: string,
  environment: Environment = GATE_ENVIRONMENT,
  sources: FlagSources = {},
): Promise<GateDecision> {
  const { flag, source } = await resolveFlag(WORK_PORTFOLIO_REMOTE_FLAG, sources);
  return {
    enabled: flag ? isFeatureEnabled(flag, environment, visitorKey) : false,
    source,
  };
}
