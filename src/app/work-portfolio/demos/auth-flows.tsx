"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #fb7185)";

type Screen = {
  id: string;
  title: string;
  fields: string[];
  cta: string;
  note?: string;
};

const SCREENS: Screen[] = [
  { id: "login", title: "Sign in", fields: ["Email", "Password"], cta: "Continue" },
  {
    id: "verify",
    title: "Verify email",
    fields: ["6-digit code"],
    cta: "Verify",
    note: "We sent a code to your inbox.",
  },
  {
    id: "recover",
    title: "Reset password",
    fields: ["New password", "Confirm password"],
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

/**
 * Vignette: the UA project's identity flows against a hosted provider,
 * login, verification, recovery, and a wallet-passport option. Presented as
 * a walkthrough of the screens, nothing actually authenticates.
 */
export default function AuthFlowsDemo({ feature }: { feature: WorkFeature }) {
  const [index, setIndex] = useState(0);
  const screen = SCREENS[index];

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
            {screen.fields.map((f) => (
              <input
                key={f}
                aria-label={f}
                placeholder={f}
                readOnly
                className="w-full rounded-md border border-border bg-black/5 px-2.5 py-1.5 text-[12px] text-muted dark:bg-white/10"
              />
            ))}
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
