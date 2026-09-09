"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, hsl(350 58% 55%))";
const GROWTH = "linear-gradient(120deg, hsl(350 72% 58%), hsl(20 92% 58%) 90%)";
const poster = "font-display font-bold uppercase tracking-tight";

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

  // The CTA only enables once every field on this screen is filled and valid,
  // so you can't advance past bad input. A screen with no fields is always ready.
  const screenValid = screen.fields.every((f) => {
    const value = values[f.label] ?? "";
    return value.length > 0 && !fieldError(f.kind, value, values);
  });

  return (
    <div
      className="flex min-h-full flex-col gap-3 p-5 text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(52% 46% at 50% 0%, hsl(350 72% 55% / 0.22), transparent 62%), radial-gradient(50% 44% at 92% 100%, hsl(20 92% 55% / 0.16), transparent 62%)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold text-muted">
            UA &amp; referrals <span style={{ color: ACCENT }}>/</span> identity
          </p>
          <h2 className={`${poster} mt-1 text-2xl leading-[0.9] sm:text-3xl`}>
            {feature.title}
          </h2>
        </div>
        <div className="flex gap-1">
          {SCREENS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={s.title}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className="h-1.5 w-6 rounded-full"
              style={{ background: i === index ? GROWTH : "var(--color-border)" }}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xs flex-1 flex-col justify-center">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl backdrop-blur-sm">
          <p className={`${poster} mb-3 text-center text-[17px]`}>
            {screen.title}
          </p>
          {screen.note && (
            <p className="mb-3 text-center text-[11px] text-muted">
              {screen.note}
            </p>
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
                    type={
                      f.kind === "password" || f.kind === "confirm"
                        ? "password"
                        : "text"
                    }
                    inputMode={f.kind === "code" ? "numeric" : undefined}
                    onChange={(e) => set(f.label, e.target.value)}
                    aria-invalid={Boolean(error)}
                    className="w-full rounded-md border bg-background px-2.5 py-1.5 text-[12px] text-foreground"
                    style={{
                      borderColor: error ? "var(--color-error-600)" : "var(--color-border)",
                    }}
                  />
                  {error && (
                    <p className="mt-0.5 text-[10px] text-error-500">{error}</p>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            disabled={!screenValid}
            onClick={() => setIndex((i) => (i + 1) % SCREENS.length)}
            className={`${poster} mt-3 w-full rounded-lg py-2.5 text-[13px] text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50`}
            style={{ background: GROWTH }}
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
