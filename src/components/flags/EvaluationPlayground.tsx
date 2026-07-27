"use client";

import { useId, useState } from "react";
import type { Environment, Flag, VariationValue } from "@/types/flags";
import { useEvaluateFlags } from "@/hooks/useFlagMutations";
import { describeReason, reasonLabel, variationName } from "@/lib/flags-utils";

interface EvaluationPlaygroundProps {
  flags: Flag[];
  environment: Environment;
}

const PLANS = ["", "free", "pro", "enterprise"] as const;

/**
 * A live evaluation harness. Enter a user context, hit Evaluate, and every flag
 * resolves through the real engine on the server, showing the served value and
 * a plain-English reason. This makes deterministic bucketing tangible: the same
 * key always lands the same way.
 */
export default function EvaluationPlayground({
  flags,
  environment,
}: EvaluationPlaygroundProps) {
  const { evaluate, results, isEvaluating, error } = useEvaluateFlags();
  const keyId = useId();
  const planId = useId();
  const countryId = useId();
  const emailId = useId();
  const betaId = useId();

  const [contextKey, setContextKey] = useState("user-42");
  const [plan, setPlan] = useState<string>("enterprise");
  const [country, setCountry] = useState("US");
  const [email, setEmail] = useState("");
  const [beta, setBeta] = useState(false);

  const flagByKey = new Map(flags.map((f) => [f.key, f]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const attributes: Record<string, string | number | boolean> = {};
    if (plan) attributes.plan = plan;
    if (country.trim()) attributes.country = country.trim();
    if (email.trim()) attributes.email = email.trim();
    if (beta) attributes.beta = true;

    evaluate({
      environment,
      context: { key: contextKey.trim() || "anonymous", attributes },
    });
  };

  return (
    <section
      aria-labelledby="playground-heading"
      className="glass-card rounded-xl border border-border p-4 sm:p-5"
    >
      <h2
        id="playground-heading"
        className="text-[15px] font-semibold text-foreground"
      >
        Evaluation playground
      </h2>
      <p className="mt-1 text-[13px] text-muted">
        Resolve every flag against a user context in{" "}
        <span className="font-medium text-foreground">{environment}</span>. The
        engine is deterministic, so the same key always resolves the same way.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field id={keyId} label="Context key (used for bucketing)">
          <input
            id={keyId}
            value={contextKey}
            onChange={(e) => setContextKey(e.target.value)}
            className={inputClass}
            placeholder="user-42"
          />
        </Field>

        <Field id={planId} label="Plan">
          <select
            id={planId}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className={inputClass}
          >
            {PLANS.map((p) => (
              <option key={p || "none"} value={p}>
                {p || "— none —"}
              </option>
            ))}
          </select>
        </Field>

        <Field id={countryId} label="Country">
          <input
            id={countryId}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass}
            placeholder="US"
          />
        </Field>

        <Field id={emailId} label="Email">
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="sam@acme.com"
          />
        </Field>

        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id={betaId}
            type="checkbox"
            checked={beta}
            onChange={(e) => setBeta(e.target.checked)}
            className="h-4 w-4 accent-primary-600"
          />
          <label htmlFor={betaId} className="text-[13px] text-foreground">
            Beta opt-in
          </label>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isEvaluating}
            className="rounded-md bg-primary-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-60"
          >
            {isEvaluating ? "Evaluating…" : "Evaluate"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-error-500">
          {error}
        </p>
      )}

      {results && (
        <div className="mt-4">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Results
          </h3>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {results.map((result) => {
              const flag = flagByKey.get(result.flagKey);
              return (
                <li
                  key={result.flagKey}
                  className="flex items-start justify-between gap-3 bg-surface px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {flag?.name ?? result.flagKey}
                      </p>
                      <span className="shrink-0 rounded-full bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                        {reasonLabel(result.reason)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {flag
                        ? describeReason(flag, environment, result)
                        : result.reason}
                    </p>
                  </div>
                  <ValueBadge
                    value={result.value}
                    label={flag ? variationName(flag, result.variationKey) : undefined}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500";

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function ValueBadge({
  value,
  label,
}: {
  value: VariationValue;
  label?: string;
}) {
  if (typeof value === "boolean") {
    return (
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          value
            ? "bg-success-100 text-success-700 dark:bg-success-950/50 dark:text-success-400"
            : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
        }`}
      >
        {value ? "on" : "off"}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
      {label ?? String(value)}
    </span>
  );
}
