"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  Environment,
  EvaluationContext,
  EvaluationResult,
  Flag,
  RolloutWeight,
} from "@/types/flags";
import { queryKeys } from "@/lib/queryKeys";
import { msUntilNextReset, formatResetCountdown } from "@/lib/flags-reset";
import { evaluateAllFlags } from "@/lib/flags-engine";
import { useFlags, useFlagAudit } from "@/hooks/useFlags";
import { useUpdateFlag } from "@/hooks/useFlagMutations";
import Tooltip from "@/components/ui/Tooltip";
import EnvironmentSwitcher from "@/components/flags/EnvironmentSwitcher";
import FlagCard from "@/components/flags/FlagCard";
import FlagsInfoStrip from "@/components/flags/FlagsInfoStrip";
import TestUserBar from "@/components/flags/TestUserBar";
import AuditLog from "@/components/flags/AuditLog";

/** The user the console tests against on first load. */
const DEFAULT_CONTEXT: EvaluationContext = {
  key: "user-42",
  attributes: { plan: "enterprise", country: "US" },
};

/**
 * The feature-flag console. Describe a user in the test bar and every flag card
 * shows what that user gets and why — live. Flip a switch or drag a rollout and
 * the verdicts re-evaluate through the real engine. Every change lands in the
 * audit log.
 */
export default function FlagsConsole() {
  const { flags, loading, error } = useFlags();
  const { audit } = useFlagAudit();
  const { updateFlag, pendingKey } = useUpdateFlag();

  const [environment, setEnvironment] = useState<Environment>("production");
  const [context, setContext] = useState<EvaluationContext>(DEFAULT_CONTEXT);

  // Writes go through the authed BFF, so a signed-out visitor can view and
  // evaluate everything but not change flags. Detect the session the same way
  // the header does, so the controls lock with a clear sign-in affordance.
  const meQuery = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<{ sub: string | null }> =>
      fetch("/api/me").then((r) => {
        if (!r.ok) throw new Error("Failed to load user");
        return r.json();
      }),
    staleTime: 5 * 60_000,
  });
  const isLoggedIn = meQuery.data?.sub != null;

  // A live "resets in ~2h 14m" hint. Computed on the client only (the boundary
  // depends on the current time) and refreshed each minute.
  const [resetLabel, setResetLabel] = useState("");
  useEffect(() => {
    const tick = () =>
      setResetLabel(formatResetCountdown(msUntilNextReset(new Date())));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Evaluate every card against the tested user right here, through the same
  // pure engine the API uses — exactly how a real flag SDK evaluates locally
  // after fetching configs. Running it on the flags the console is showing (not
  // a separate server read) keeps each verdict in lockstep with the switches and
  // sliders: an optimistic rollout change re-evaluates instantly, with no
  // round-trip to race and no flash of a stale verdict.
  const results = useMemo(
    () => evaluateAllFlags(flags, environment, context),
    [flags, environment, context],
  );

  const resultByKey = useMemo(
    () => new Map(results.map((r) => [r.flagKey, r])),
    [results],
  );

  // Real flags gate live features; demo flags just illustrate the mechanics.
  // Show the real ones first so the thing that actually ships leads the page.
  const realFlags = useMemo(() => flags.filter((f) => f.real), [flags]);
  const demoFlags = useMemo(() => flags.filter((f) => !f.real), [flags]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-sm text-error-500">{error}</p>
      </div>
    );
  }

  return (
    <main className="reveal-up mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feature flags</h1>
        <p className="mt-1 text-sm text-muted">
          A flag decides what each user sees. Describe a user below and watch
          every flag make its call — live. Flip a switch or drag a rollout and
          the calls update instantly.
        </p>
      </div>

      <FlagsInfoStrip
        isLoggedIn={isLoggedIn}
        resetLabel={resetLabel || "a few hours"}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <p className="text-[12px] text-muted">Environment</p>
            <Tooltip
              multiline
              delay={150}
              content="Development, staging, and production are three separate configs for the same flag — its own kill switch, targeting, and rollout in each. This picker only changes which one you're viewing and editing here; it's local UI, not wired to a real deploy pipeline."
            >
              <button
                type="button"
                aria-label="What do the environments do?"
                className="flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-muted transition-colors hover:text-foreground"
              >
                i
              </button>
            </Tooltip>
          </div>
          <EnvironmentSwitcher value={environment} onChange={setEnvironment} />
        </div>
        <p className="text-[13px] text-muted">
          {flags.length} flags in {environment}
        </p>
      </div>

      <TestUserBar
        context={context}
        onEvaluate={setContext}
        isEvaluating={false}
      />

      {loading && flags.length === 0 ? (
        <FlagGridSkeleton />
      ) : (
        <div className="space-y-8">
          <FlagSection
            title="Gating a real feature"
            subtitle="These control a live page. Flip them and real visitors feel it."
            flags={realFlags}
            environment={environment}
            pendingKey={pendingKey}
            isLoggedIn={isLoggedIn}
            contextKey={context.key}
            resultByKey={resultByKey}
            updateFlag={updateFlag}
            requiresSignIn
          />
          <FlagSection
            title="Demo flags"
            subtitle="Illustrations of the mechanics. They don't gate anything live."
            flags={demoFlags}
            environment={environment}
            pendingKey={pendingKey}
            isLoggedIn={isLoggedIn}
            contextKey={context.key}
            resultByKey={resultByKey}
            updateFlag={updateFlag}
          />
        </div>
      )}

      <AuditLog audit={audit} />
    </main>
  );
}

type UpdateFlagInput = {
  flagKey: string;
  environment: Environment;
  enabled?: boolean;
  fallthrough?: RolloutWeight[];
};

type FlagSectionProps = {
  title: string;
  subtitle: string;
  flags: readonly Flag[];
  environment: Environment;
  pendingKey: string | null;
  isLoggedIn: boolean;
  contextKey: string;
  resultByKey: Map<string, EvaluationResult>;
  updateFlag: (input: UpdateFlagInput) => Promise<Flag>;
  /** When true, a signed-out visitor sees a sign-in notice right in the header. */
  requiresSignIn?: boolean;
};

/** One titled group of flag cards. Skips itself entirely when empty. */
function FlagSection({
  title,
  subtitle,
  flags,
  environment,
  pendingKey,
  isLoggedIn,
  contextKey,
  resultByKey,
  updateFlag,
  requiresSignIn = false,
}: FlagSectionProps) {
  if (flags.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-[13px] text-muted">{subtitle}</p>
      </div>
      {requiresSignIn && !isLoggedIn && (
        <div className="flex items-start gap-2 rounded-lg border border-warning-300 bg-warning-100 px-3 py-2 text-[13px] text-warning-700 dark:border-warning-900 dark:bg-warning-950/40 dark:text-warning-400">
          <span aria-hidden className="mt-0.5 shrink-0">
            🔒
          </span>
          <span>
            This one gates a live page, so changing it needs a sign-in.{" "}
            <a
              href="/auth/login"
              className="font-semibold underline underline-offset-2"
            >
              Sign in to change it
            </a>
            . Everything else here stays open — view it, evaluate it, watch the
            verdict update.
          </span>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {flags.map((flag) => (
          <FlagCard
            key={flag.key}
            flag={flag}
            environment={environment}
            pending={pendingKey === flag.key}
            canEdit={!flag.real || isLoggedIn}
            contextKey={contextKey}
            result={resultByKey.get(flag.key)}
            onToggle={(enabled) =>
              updateFlag({ flagKey: flag.key, environment, enabled })
            }
            onRollout={(fallthrough) =>
              updateFlag({ flagKey: flag.key, environment, fallthrough })
            }
          />
        ))}
      </div>
    </section>
  );
}

function FlagGridSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-xl border border-border bg-surface"
        />
      ))}
    </div>
  );
}
