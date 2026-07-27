"use client";

import { useState } from "react";
import { m } from "framer-motion";
import type { Environment } from "@/types/flags";
import { fadeInUp, spring } from "@/lib/animations";
import { useFlags, useFlagAudit } from "@/hooks/useFlags";
import { useUpdateFlag } from "@/hooks/useFlagMutations";
import EnvironmentSwitcher from "@/components/flags/EnvironmentSwitcher";
import FlagCard from "@/components/flags/FlagCard";
import EvaluationPlayground from "@/components/flags/EvaluationPlayground";
import AuditLog from "@/components/flags/AuditLog";

/**
 * The feature-flag console. Pick an environment, toggle flags and adjust
 * rollouts (optimistically), test a user context in the evaluation playground,
 * and watch every change land in the audit log.
 */
export default function FlagsConsole() {
  const { flags, loading, error } = useFlags();
  const { audit } = useFlagAudit();
  const { updateFlag, pendingKey } = useUpdateFlag();
  const [environment, setEnvironment] = useState<Environment>("production");

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
          A demo flag-management console — targeting rules, sticky percentage
          rollouts, a kill switch per environment, and a live evaluation
          playground. In-memory demo data; the evaluation engine is the real,
          deterministic thing.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <EnvironmentSwitcher value={environment} onChange={setEnvironment} />
        <p className="text-[13px] text-muted">
          {flags.length} flags in {environment}
        </p>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <EvaluationPlayground flags={flags} environment={environment} />
        <AuditLog audit={audit} />
      </div>
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
