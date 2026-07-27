import type {
  AuditEntry,
  Environment,
  Flag,
  RolloutWeight,
} from "@/types/flags";

// ---------------------------------------------------------------------------
// Seeded in-memory flag store for demo mode (no real backend).
//
// As with the operator dashboard, Next.js can bundle each route handler with
// its own copy of a module, so the store is attached to globalThis to guarantee
// every handler (GET flags, PATCH, evaluate, audit) shares one instance.
// ---------------------------------------------------------------------------

type FlagsDataStore = {
  flags: Flag[];
  audit: AuditEntry[];
  auditSeq: number;
};

const GLOBAL_KEY = "__flagsDataStore" as const;

const BOOLEAN = [
  { key: "on", name: "Enabled", value: true },
  { key: "off", name: "Disabled", value: false },
] as const;

/** Shorthand for the common on/off env config so the seed reads cleanly. */
function boolEnv(config: {
  enabled: boolean;
  rules?: Flag["environments"]["development"]["rules"];
  fallthrough: RolloutWeight[];
}): Flag["environments"]["development"] {
  return {
    enabled: config.enabled,
    offVariation: "off",
    rules: config.rules ?? [],
    fallthrough: config.fallthrough,
  };
}

function seedFlags(): Flag[] {
  return [
    {
      key: "new-checkout",
      name: "New checkout flow",
      description:
        "Rebuilt checkout with saved cards and express pay. Rolling out gradually to watch conversion.",
      kind: "boolean",
      tags: ["checkout", "revenue"],
      variations: [...BOOLEAN],
      createdAt: "2026-05-02T14:00:00.000Z",
      environments: {
        development: boolEnv({
          enabled: true,
          fallthrough: [{ variation: "on", weight: 100 }],
        }),
        staging: boolEnv({
          enabled: true,
          fallthrough: [{ variation: "on", weight: 100 }],
        }),
        production: boolEnv({
          enabled: true,
          rules: [
            {
              id: "nc-enterprise",
              description: "Enterprise accounts get it first",
              clauses: [
                { attribute: "plan", op: "in", values: ["enterprise"] },
              ],
              serve: "on",
            },
          ],
          fallthrough: [
            { variation: "on", weight: 25 },
            { variation: "off", weight: 75 },
          ],
        }),
      },
    },
    {
      key: "ai-search",
      name: "AI-powered search",
      description:
        "Semantic search backed by embeddings. Gated to beta users and internal accounts while we tune relevance.",
      kind: "boolean",
      tags: ["search", "ai", "beta"],
      variations: [...BOOLEAN],
      createdAt: "2026-06-10T09:30:00.000Z",
      environments: {
        development: boolEnv({
          enabled: true,
          fallthrough: [{ variation: "on", weight: 100 }],
        }),
        staging: boolEnv({
          enabled: true,
          rules: [
            {
              id: "ais-beta",
              description: "Opted-in beta testers",
              clauses: [{ attribute: "beta", op: "in", values: ["true"] }],
              serve: "on",
            },
          ],
          fallthrough: [{ variation: "off", weight: 100 }],
        }),
        production: boolEnv({
          enabled: true,
          rules: [
            {
              id: "ais-internal",
              description: "Internal @acme accounts",
              clauses: [
                { attribute: "email", op: "endsWith", values: ["@acme.com"] },
              ],
              serve: "on",
            },
          ],
          fallthrough: [
            { variation: "on", weight: 10 },
            { variation: "off", weight: 90 },
          ],
        }),
      },
    },
    {
      key: "checkout-experience",
      name: "Checkout experiment (A/B/C)",
      description:
        "Multivariate test of three checkout layouts. Traffic is split evenly and bucketing is sticky so a user always sees the same layout.",
      kind: "multivariate",
      tags: ["checkout", "experiment"],
      variations: [
        { key: "control", name: "Control", value: "control" },
        { key: "variant-a", name: "Variant A - single page", value: "variant-a" },
        { key: "variant-b", name: "Variant B - wizard", value: "variant-b" },
      ],
      createdAt: "2026-06-22T11:00:00.000Z",
      environments: {
        development: {
          enabled: true,
          offVariation: "control",
          rules: [],
          fallthrough: [
            { variation: "control", weight: 34 },
            { variation: "variant-a", weight: 33 },
            { variation: "variant-b", weight: 33 },
          ],
        },
        staging: {
          enabled: true,
          offVariation: "control",
          rules: [],
          fallthrough: [
            { variation: "control", weight: 34 },
            { variation: "variant-a", weight: 33 },
            { variation: "variant-b", weight: 33 },
          ],
        },
        production: {
          enabled: false,
          offVariation: "control",
          rules: [],
          fallthrough: [
            { variation: "control", weight: 100 },
            { variation: "variant-a", weight: 0 },
            { variation: "variant-b", weight: 0 },
          ],
        },
      },
    },
    {
      key: "priority-support",
      name: "Priority support queue",
      description:
        "Routes paid plans to the fast support queue. A pure targeting flag - no percentage rollout.",
      kind: "boolean",
      tags: ["support", "entitlement"],
      variations: [...BOOLEAN],
      createdAt: "2026-03-14T16:45:00.000Z",
      environments: {
        development: boolEnv({
          enabled: true,
          rules: [
            {
              id: "ps-paid",
              description: "Pro and enterprise plans",
              clauses: [
                { attribute: "plan", op: "in", values: ["pro", "enterprise"] },
              ],
              serve: "on",
            },
          ],
          fallthrough: [{ variation: "off", weight: 100 }],
        }),
        staging: boolEnv({
          enabled: true,
          rules: [
            {
              id: "ps-paid",
              description: "Pro and enterprise plans",
              clauses: [
                { attribute: "plan", op: "in", values: ["pro", "enterprise"] },
              ],
              serve: "on",
            },
          ],
          fallthrough: [{ variation: "off", weight: 100 }],
        }),
        production: boolEnv({
          enabled: true,
          rules: [
            {
              id: "ps-paid",
              description: "Pro and enterprise plans",
              clauses: [
                { attribute: "plan", op: "in", values: ["pro", "enterprise"] },
              ],
              serve: "on",
            },
          ],
          fallthrough: [{ variation: "off", weight: 100 }],
        }),
      },
    },
    {
      key: "dark-mode",
      name: "Dark mode",
      description: "Fully launched. Kept as a flag so it can be killed instantly if a regression appears.",
      kind: "boolean",
      tags: ["ui"],
      variations: [...BOOLEAN],
      createdAt: "2026-01-08T10:00:00.000Z",
      environments: {
        development: boolEnv({
          enabled: true,
          fallthrough: [{ variation: "on", weight: 100 }],
        }),
        staging: boolEnv({
          enabled: true,
          fallthrough: [{ variation: "on", weight: 100 }],
        }),
        production: boolEnv({
          enabled: true,
          fallthrough: [{ variation: "on", weight: 100 }],
        }),
      },
    },
  ];
}

function seedAudit(): AuditEntry[] {
  // Newest first, matching the order the log is served in.
  return [
    {
      id: "audit-003",
      flagKey: "new-checkout",
      environment: "production",
      action: "rollout-changed",
      summary: "Production rollout raised to 25% on",
      actor: "paul@paul-explore.dev",
      timestamp: "2026-07-20T18:12:00.000Z",
    },
    {
      id: "audit-002",
      flagKey: "ai-search",
      environment: "production",
      action: "enabled",
      summary: "Enabled in production",
      actor: "paul@paul-explore.dev",
      timestamp: "2026-07-18T14:05:00.000Z",
    },
    {
      id: "audit-001",
      flagKey: "checkout-experience",
      environment: "production",
      action: "disabled",
      summary: "Disabled in production pending staging results",
      actor: "paul@paul-explore.dev",
      timestamp: "2026-07-15T09:41:00.000Z",
    },
  ];
}

function initDataStore(): FlagsDataStore {
  return { flags: seedFlags(), audit: seedAudit(), auditSeq: 3 };
}

function getDataStore(): FlagsDataStore {
  const g = globalThis as unknown as Record<string, FlagsDataStore>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = initDataStore();
  }
  return g[GLOBAL_KEY];
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export function getFlags(): readonly Flag[] {
  return getDataStore().flags;
}

export function getFlag(key: string): Flag | undefined {
  return getDataStore().flags.find((f) => f.key === key);
}

export function getAudit(): readonly AuditEntry[] {
  return getDataStore().audit;
}

function nextAuditId(ds: FlagsDataStore): string {
  ds.auditSeq += 1;
  return `audit-${String(ds.auditSeq).padStart(3, "0")}`;
}

/** Builds an ISO timestamp. Isolated so tests can reason about ordering. */
function now(): string {
  return new Date().toISOString();
}

function recordAudit(
  ds: FlagsDataStore,
  entry: Omit<AuditEntry, "id" | "timestamp">,
): void {
  ds.audit = [
    { ...entry, id: nextAuditId(ds), timestamp: now() },
    ...ds.audit,
  ];
}

/** Replaces one flag in the store with an updated copy (immutably). */
function replaceFlag(ds: FlagsDataStore, updated: Flag): void {
  ds.flags = ds.flags.map((f) => (f.key === updated.key ? updated : f));
}

/**
 * Toggles the kill switch for a flag in one environment, records an audit
 * entry, and returns the updated flag. Returns undefined if the flag or the
 * environment config is missing.
 */
export function setFlagEnabled(
  key: string,
  environment: Environment,
  enabled: boolean,
): Flag | undefined {
  const ds = getDataStore();
  const flag = ds.flags.find((f) => f.key === key);
  const config = flag?.environments[environment];
  if (!flag || !config) return undefined;

  const updated: Flag = {
    ...flag,
    environments: {
      ...flag.environments,
      [environment]: { ...config, enabled },
    },
  };
  replaceFlag(ds, updated);
  recordAudit(ds, {
    flagKey: key,
    environment,
    action: enabled ? "enabled" : "disabled",
    summary: `${enabled ? "Enabled" : "Disabled"} in ${environment}`,
    actor: "you@demo",
  });
  return updated;
}

/**
 * Replaces the fallthrough rollout for a flag in one environment, records an
 * audit entry, and returns the updated flag.
 */
export function setFallthrough(
  key: string,
  environment: Environment,
  fallthrough: readonly RolloutWeight[],
): Flag | undefined {
  const ds = getDataStore();
  const flag = ds.flags.find((f) => f.key === key);
  const config = flag?.environments[environment];
  if (!flag || !config) return undefined;

  const updated: Flag = {
    ...flag,
    environments: {
      ...flag.environments,
      [environment]: { ...config, fallthrough: [...fallthrough] },
    },
  };
  replaceFlag(ds, updated);

  const onSlice = fallthrough.find((w) => w.variation === "on");
  const summary = onSlice
    ? `${environment} rollout set to ${onSlice.weight}% on`
    : `${environment} rollout weights updated`;
  recordAudit(ds, {
    flagKey: key,
    environment,
    action: "rollout-changed",
    summary,
    actor: "you@demo",
  });
  return updated;
}
