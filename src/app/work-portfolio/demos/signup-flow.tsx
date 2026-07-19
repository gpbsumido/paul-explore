"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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

/** Which fields each step requires before you can advance. */
const REQUIRED: Record<StepName, (keyof Form)[]> = {
  Contact: ["name", "email"],
  Vehicle: ["make", "plate"],
  Review: [],
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Flagship demo for the driver-onboarding take-home. A three-step signup
 * wizard with per-step validation, a campaign-attribution chip carried from
 * the entry link, and a completion screen.
 */
export default function SignupFlowDemo({ feature }: { feature: WorkFeature }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [done, setDone] = useState(false);

  // In the real app this came off the entry link's utm params. Fixed here.
  const attribution = { source: "spring-drive", medium: "referral" };

  const set = (key: keyof Form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const current: StepName = STEPS[step];

  /** Validate the current step, return true when it's clear to advance. */
  const validateStep = () => {
    const next: Partial<Record<keyof Form, string>> = {};
    for (const key of REQUIRED[current]) {
      if (!form[key].trim()) next[key] = "Required";
    }
    if (current === "Contact" && form.email && !EMAIL_RE.test(form.email)) {
      next.email = "Enter a valid email";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  if (done) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 p-4 text-center">
        <span aria-hidden className="text-3xl">🎉</span>
        <p className="text-[15px] font-bold text-foreground">
          Welcome aboard, {form.name || "driver"}
        </p>
        <p className="text-[12px] text-muted">
          Signup complete. Attributed to{" "}
          <span className="font-medium text-foreground">{attribution.source}</span>.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={() => {
            setForm(EMPTY);
            setStep(0);
            setDone(false);
          }}
        >
          Start over
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>
        <span
          className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted"
          title="campaign attribution from the entry link"
        >
          utm: {attribution.source}
        </span>
      </div>

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
            <Field label="Full name" value={form.name} error={errors.name} onChange={(v) => set("name", v)} />
            <Field label="Email" value={form.email} error={errors.email} onChange={(v) => set("email", v)} />
          </>
        )}
        {current === "Vehicle" && (
          <>
            <Field label="Make & model" value={form.make} error={errors.make} onChange={(v) => set("make", v)} />
            <Field label="License plate" value={form.plate} error={errors.plate} onChange={(v) => set("plate", v)} />
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
        <Button
          variant="outline"
          size="sm"
          onClick={back}
          disabled={step === 0}
        >
          Back
        </Button>
        {current === "Review" ? (
          <button
            type="button"
            onClick={() => setDone(true)}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
            style={{ backgroundColor: ACCENT }}
          >
            Submit
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
            style={{ backgroundColor: ACCENT }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  return (
    <Input
      label={label}
      size="sm"
      value={value}
      error={error}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
