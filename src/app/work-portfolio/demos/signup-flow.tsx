"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #34d399)";

const STEPS = ["Contact", "Vehicle", "Review"] as const;
type StepName = (typeof STEPS)[number];

type Form = {
  name: string;
  email: string;
  make: string;
  plate: string;
};

const EMPTY: Form = { name: "", email: "", make: "", plate: "" };

/**
 * Flagship demo for the driver-onboarding take-home. A three-step signup
 * wizard. This commit is the step scaffolding and navigation; validation,
 * campaign attribution, and the completion screen come next.
 */
export default function SignupFlowDemo({ feature }: { feature: WorkFeature }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);

  const set = (key: keyof Form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const current: StepName = STEPS[step];
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <ol className="flex items-center gap-2 text-[11px]">
        {STEPS.map((name, i) => (
          <li key={name} className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                i <= step ? "text-white" : "border border-border text-muted"
              }`}
              style={i <= step ? { backgroundColor: ACCENT } : undefined}
            >
              {i + 1}
            </span>
            <span className={i === step ? "text-foreground" : "text-muted"}>
              {name}
            </span>
            {i < STEPS.length - 1 && <span className="text-muted">›</span>}
          </li>
        ))}
      </ol>

      <div className="min-h-0 flex-1 space-y-2">
        {current === "Contact" && (
          <>
            <Field label="Full name" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
          </>
        )}
        {current === "Vehicle" && (
          <>
            <Field label="Make & model" value={form.make} onChange={(v) => set("make", v)} />
            <Field label="License plate" value={form.plate} onChange={(v) => set("plate", v)} />
          </>
        )}
        {current === "Review" && (
          <dl className="space-y-1 text-[12px]">
            {(
              [
                ["Name", form.name],
                ["Email", form.email],
                ["Vehicle", form.make],
                ["Plate", form.plate],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border py-1">
                <dt className="text-muted">{k}</dt>
                <dd className="text-foreground">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="rounded-md border border-border px-3 py-1.5 text-[12px] text-foreground disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={next}
          disabled={step === STEPS.length - 1}
          className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
          style={{ backgroundColor: ACCENT }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] text-muted">{label}</span>
      <input
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground"
      />
    </label>
  );
}
