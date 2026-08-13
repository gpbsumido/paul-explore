/**
 * Who is allowed to change which flag.
 *
 * There are three tiers rather than a signed-in/signed-out split, because the
 * console is doing two jobs at once. Most of it is a playground meant to be
 * touched by anyone who wanders in, and one part of it is a live kill switch
 * for a real feature. Collapsing those into one rule makes either the
 * playground useless or the kill switch reckless.
 *
 * This module is the single source of truth: the API route gates on it and the
 * console renders from it, so what the page says and what the server enforces
 * cannot drift apart.
 */

/** The three levels, loosest first. */
export const ACCESS_TIERS = ["open", "authed", "admin"] as const;

export type FlagAccess = (typeof ACCESS_TIERS)[number];

/** Short label for the group heading on the console. */
export const ACCESS_LABEL: Record<FlagAccess, string> = {
  open: "Open to everyone",
  authed: "Signed-in visitors",
  admin: "Site owner only",
};

/** One line under the heading, saying plainly who can change these. */
export function whoCanChange(access: FlagAccess): string {
  switch (access) {
    case "open":
      return "Anyone can flip these, signed in or not. They control nothing outside this page.";
    case "authed":
      return "Any signed-in visitor can flip these. Still a demo — nothing real changes.";
    case "admin":
      return "These gate live features, so only the addresses on the server's allowlist can change them. Everyone else can watch them evaluate.";
  }
}

/**
 * Which tier each known flag sits in, keyed by flag key.
 *
 * This lives in the BFF rather than in the flag records because the upstream
 * API does not carry an access field, and it serves a different set of flags
 * than the local seed does. Deriving the tier from the record therefore gave
 * two different answers on the two sides -- the console inferred every API
 * flag as open while the route enforced from seed data -- which is the drift
 * this module exists to prevent. Keying on the flag key is the one thing both
 * sides always have.
 */
const ACCESS_BY_KEY: Record<string, FlagAccess> = {
  // Gate live features.
  "pocket-tcg": "admin",
  "world-live-presence": "admin",
  // Demo, but worth an account: they model account-shaped decisions.
  "new-checkout": "authed",
  "checkout-experience": "authed",
  "priority-support": "authed",
  // Pure playground.
  "dark-mode": "open",
  "ai-search": "open",
};

/**
 * The tier a flag belongs to.
 *
 * Order of preference: an explicit `access` on the record (so the upstream API
 * can start sending one and immediately win), then the key map, then `real`.
 * The final fallback infers upward -- a flag gating a live feature falls to
 * `admin`, never to something looser. Guessing safe costs a little friction;
 * guessing loose hands a stranger a live kill switch.
 */
export function accessOf(flag: {
  key?: string;
  real?: boolean;
  access?: string | null;
}): FlagAccess {
  const declared = ACCESS_TIERS.find((tier) => tier === flag.access);
  if (declared) return declared;
  const mapped = flag.key ? ACCESS_BY_KEY[flag.key] : undefined;
  if (mapped) return mapped;
  // Only a flag positively known to be a demo opens up. `real` being absent is
  // not the same as it being false: getFlag searches the local seed, the API
  // serves a wider set, so an upstream-only key arrives with `real` undefined
  // and would otherwise land on the loosest rung -- the exact flags this map
  // has never heard of being the ones it protects least.
  return flag.real === false ? "open" : "admin";
}

/**
 * What to say when a rung has no flags in it.
 *
 * The rung still renders. Hiding an empty group would mean the page silently
 * shows two rungs while claiming three, and the one most likely to be empty is
 * the one people most need explained.
 */
export function emptyTierNote(access: FlagAccess): string {
  switch (access) {
    case "open":
      return "Nothing in this group right now.";
    case "authed":
      return "Nothing in this group right now.";
    case "admin":
      return "Nothing here yet. The kill switches for /tcg/pocket and /world live presence belong in this group, but the flag API does not serve them yet — they still resolve from a value committed in the repo, so they cannot be flipped from this console.";
  }
}

/** Whether this viewer may change a flag at this tier. */
export function canChangeFlag({
  access,
  isLoggedIn,
  isAdmin,
}: {
  access: FlagAccess;
  isLoggedIn: boolean;
  isAdmin: boolean;
}): boolean {
  if (access === "open") return true;
  // Everything below here needs a session first. An admin bit without one is a
  // contradiction, and honouring it would make the session check decorative.
  if (!isLoggedIn) return false;
  return access === "authed" || isAdmin;
}

/**
 * Why the controls are locked, phrased for the person looking at them, or null
 * when they are not locked. Signing in fixes one of these and not the other,
 * so they must not read the same.
 */
export function lockReason(
  access: FlagAccess,
  { isLoggedIn, isAdmin }: { isLoggedIn: boolean; isAdmin: boolean },
): string | null {
  if (canChangeFlag({ access, isLoggedIn, isAdmin })) return null;
  if (!isLoggedIn) return "Sign in to change this flag.";
  return "Only the site owner can change this one — it gates a live feature.";
}
