"use client";

import { useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import type { Environment, EvaluationContext } from "@/types/flags";
import { fadeInUp, spring } from "@/lib/animations";
import { useFlags, useFlagAudit } from "@/hooks/useFlags";
import { useUpdateFlag, useEvaluateFlags } from "@/hooks/useFlagMutations";
import EnvironmentSwitcher from "@/components/flags/EnvironmentSwitcher";
import FlagCard from "@/components/flags/FlagCard";
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
  const { evaluate, results, isEvaluating } = useEvaluateFlags();

  const [environment, setEnvironment] = useState<Environment>("production");
  const [context, setContext] = useState<EvaluationContext>(DEFAULT_CONTEXT);

  // Re-evaluate whenever the tested user, the environment, or any flag's config
  // changes, so the verdict on each card is always current. The signature keeps
  // the effect from firing on unrelated re-renders.
  const flagsSignature = useMemo(
    () =>
      JSON.stringify(flags.map((f) => [f.key, f.environments[environment]])),
    [flags, environment],
  );

  useEffect(() => {
    if (flags.length === 0) return;
    void evaluate({ environment, context }).catch(() => {});
  }, [evaluate, environment, context, flagsSignature, flags.length]);

  const resultByKey = useMemo(
    () => new Map((results ?? []).map((r) => [r.flagKey, r])),
    [results],
  );

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-sm text-error-500">{error}</p>
      </div>
    );
  }

  return (
    <m.main
      className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={spring.smooth}
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feature flags</h1>
        <p className="mt-1 text-sm text-muted">
          A flag decides what each user sees. Describe a user below and watch
          every flag make its call — live. Flip a switch or drag a rollout and
          the calls update instantly. Demo data, real deterministic engine.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[12px] text-muted">Environment</p>
          <EnvironmentSwitcher value={environment} onChange={setEnvironment} />
        </div>
        <p className="text-[13px] text-muted">
          {flags.length} flags in {environment}
        </p>
      </div>

      <TestUserBar
        context={context}
        onEvaluate={setContext}
        isEvaluating={isEvaluating}
      />

      {loading && flags.length === 0 ? (
        <FlagGridSkeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {flags.map((flag) => (
            <FlagCard
              key={flag.key}
              flag={flag}
              environment={environment}
              pending={pendingKey === flag.key}
              contextKey={context.key}
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
      )}

      <AuditLog audit={audit} />
    </m.main>
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
