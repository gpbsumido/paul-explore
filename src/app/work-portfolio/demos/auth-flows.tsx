"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #fb7185)";

type FieldKind = "email" | "password" | "confirm" | "code";
type Field = { label: string; kind: FieldKind };

type Screen = {
  id: string;
  title: string;
  fields: Field[];
  cta: string;
  note?: string;
};

const SCREENS: Screen[] = [
  {
    id: "login",
    title: "Sign in",
    fields: [
      { label: "Email", kind: "email" },
      { label: "Password", kind: "password" },
    ],
    cta: "Continue",
  },
  {
    id: "verify",
    title: "Verify email",
    fields: [{ label: "6-digit code", kind: "code" }],
    cta: "Verify",
    note: "We sent a code to your inbox.",
  },
  {
    id: "recover",
    title: "Reset password",
    fields: [
      { label: "New password", kind: "password" },
      { label: "Confirm password", kind: "confirm" },
    ],
    cta: "Save",
  },
  {
    id: "passport",
    title: "Wallet passport",
    fields: [],
    cta: "Connect wallet",
    note: "Or continue with a linked wallet identity.",
  },
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Validate one field against what's been typed. Returns a message when the
 * value is present but invalid; empty fields don't nag until you type.
 */
function fieldError(
  kind: FieldKind,
  value: string,
  values: Record<string, string>,
): string | undefined {
  if (!value) return undefined;
  switch (kind) {
    case "email":
      return EMAIL_RE.test(value) ? undefined : "Enter a valid email";
    case "password":
      return value.length >= 8 ? undefined : "At least 8 characters";
    case "confirm":
      return value === (values["New password"] ?? "")
        ? undefined
        : "Passwords must match";
    case "code":
      return /^\d{6}$/.test(value) ? undefined : "Enter the 6-digit code";
  }
}

/**
 * Vignette: the UA project's identity flows against a hosted provider,
 * login, verification, recovery, and a wallet-passport option. The fields are
 * really typeable with inline validation, but nothing actually authenticates.
 */
export default function AuthFlowsDemo({ feature }: { feature: WorkFeature }) {
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const screen = SCREENS[index];

  const set = (label: string, value: string) =>
    setValues((v) => ({ ...v, [label]: value }));

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>
        <div className="flex gap-1">
          {SCREENS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={s.title}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className="h-1.5 w-6 rounded-full"
              style={{
                backgroundColor: i === index ? ACCENT : "var(--color-border, #8884)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xs flex-1 flex-col justify-center">
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <p className="mb-3 text-center text-[15px] font-bold text-foreground">
            {screen.title}
          </p>
          {screen.note && (
            <p className="mb-3 text-center text-[11px] text-muted">{screen.note}</p>
          )}
          <div className="space-y-2">
            {screen.fields.map((f) => {
              const value = values[f.label] ?? "";
              const error = fieldError(f.kind, value, values);
              return (
                <div key={f.label}>
                  <input
                    aria-label={f.label}
                    placeholder={f.label}
                    value={value}
                    type={f.kind === "password" || f.kind === "confirm" ? "password" : "text"}
                    inputMode={f.kind === "code" ? "numeric" : undefined}
                    onChange={(e) => set(f.label, e.target.value)}
                    aria-invalid={Boolean(error)}
                    className="w-full rounded-md border bg-background px-2.5 py-1.5 text-[12px] text-foreground"
                    style={{ borderColor: error ? "#ef4444" : "var(--color-border)" }}
                  />
                  {error && <p className="mt-0.5 text-[10px] text-red-500">{error}</p>}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % SCREENS.length)}
            className="mt-3 w-full rounded-md py-2 text-[12px] font-medium text-white"
            style={{ backgroundColor: ACCENT }}
          >
            {screen.cta}
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted">
          walkthrough only, nothing authenticates
        </p>
      </div>
    </div>
  );
}
