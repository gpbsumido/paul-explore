"use client";

import { useId, useState } from "react";
import type { EvaluationContext } from "@/types/flags";

interface TestUserBarProps {
  /** The context to seed the form with (also updated by presets). */
  context: EvaluationContext;
  /** Called with a committed context whenever the user changes who they test. */
  onEvaluate: (context: EvaluationContext) => void;
  isEvaluating: boolean;
}

type Draft = {
  key: string;
  plan: string;
  country: string;
  email: string;
  beta: boolean;
};

const PLANS = ["", "free", "pro", "enterprise"] as const;

const PRESETS: ReadonlyArray<{ label: string; hint: string; draft: Draft }> = [
  {
    label: "Enterprise user",
    hint: "plan = enterprise",
    draft: { key: "ava-42", plan: "enterprise", country: "US", email: "ava@acme.com", beta: false },
  },
  {
    label: "Beta tester",
    hint: "beta opt-in, pro plan",
    draft: { key: "sam-beta", plan: "pro", country: "CA", email: "sam@gmail.com", beta: true },
  },
  {
    label: "Anonymous visitor",
    hint: "no attributes",
    draft: { key: "anon-9f2", plan: "", country: "", email: "", beta: false },
  },
];

/** Turns the form draft into a real evaluation context, dropping empty fields. */
function toContext(draft: Draft): EvaluationContext {
  const attributes: EvaluationContext["attributes"] = {};
  if (draft.plan) attributes.plan = draft.plan;
  if (draft.country.trim()) attributes.country = draft.country.trim();
  if (draft.email.trim()) attributes.email = draft.email.trim();
  if (draft.beta) attributes.beta = true;
  return { key: draft.key.trim() || "anonymous", attributes };
}

/** Reads the initial form draft back out of an evaluation context. */
function toDraft(context: EvaluationContext): Draft {
  const attr = context.attributes;
  return {
    key: context.key,
    plan: typeof attr.plan === "string" ? attr.plan : "",
    country: typeof attr.country === "string" ? attr.country : "",
    email: typeof attr.email === "string" ? attr.email : "",
    beta: attr.beta === true,
  };
}

/**
 * The spine of the console: describe a hypothetical user and every flag card
 * shows what that user gets, live. Presets make the idea land in one click;
 * the raw fields let you probe edge cases. Selects and presets evaluate
 * immediately; text fields evaluate when you leave them or press Enter.
 */
export default function TestUserBar({
  context,
  onEvaluate,
  isEvaluating,
}: TestUserBarProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(context));
  const keyId = useId();
  const planId = useId();
  const countryId = useId();
  const emailId = useId();
  const betaId = useId();

  const commit = (next: Draft) => {
    setDraft(next);
    onEvaluate(toContext(next));
  };

  const commitCurrent = () => onEvaluate(toContext(draft));

  return (
    <section
      aria-labelledby="test-user-heading"
      className="glass-card rounded-xl border border-border p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2
          id="test-user-heading"
          className="text-[15px] font-semibold text-foreground"
        >
          Test a user
        </h2>
        <p className="text-[12px] text-muted">
          {isEvaluating ? "Evaluating…" : "Every flag below updates live"}
        </p>
      </div>
      <p className="mt-1 text-[13px] text-muted">
        Describe someone and watch each flag decide what they see. Start with a
        preset, then tweak.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => commit(preset.draft)}
            title={preset.hint}
            className="rounded-full border border-border bg-surface px-3 py-1 text-[12px] font-medium text-foreground transition-colors hover:border-primary-400 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          commitCurrent();
        }}
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        <Field id={keyId} label="Who (used to bucket rollouts)">
          <input
            id={keyId}
            value={draft.key}
            onChange={(e) => setDraft({ ...draft, key: e.target.value })}
            onBlur={commitCurrent}
            className={inputClass}
            placeholder="user-42"
          />
        </Field>

        <Field id={planId} label="Plan">
          <select
            id={planId}
            value={draft.plan}
            onChange={(e) => commit({ ...draft, plan: e.target.value })}
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
            value={draft.country}
            onChange={(e) => setDraft({ ...draft, country: e.target.value })}
            onBlur={commitCurrent}
            className={inputClass}
            placeholder="US"
          />
        </Field>

        <Field id={emailId} label="Email">
          <input
            id={emailId}
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            onBlur={commitCurrent}
            className={inputClass}
            placeholder="sam@acme.com"
          />
        </Field>

        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id={betaId}
            type="checkbox"
            checked={draft.beta}
            onChange={(e) => commit({ ...draft, beta: e.target.checked })}
            className="h-4 w-4 accent-primary-600"
          />
          <label htmlFor={betaId} className="text-[13px] text-foreground">
            Beta opt-in
          </label>
        </div>
      </form>
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
