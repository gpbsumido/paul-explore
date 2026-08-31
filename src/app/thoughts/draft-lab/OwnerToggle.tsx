"use client";

import { useState } from "react";

/**
 * Reveals the Elite-tier write-up. The children are rendered on the server ONLY
 * when the viewer is the owner (see page.tsx), so a non-owner never receives
 * this content in the payload at all — the toggle only shows/hides what's
 * already been authorized server-side.
 */
export default function OwnerToggle({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-10">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-black/20 p-4">
        <span className="text-sm font-semibold">Owner view</span>
        <span className="min-w-0 flex-1 text-xs text-muted">
          Elite-tier features and the decisions behind them — visible only to
          you. The public write-up above covers the free and pro tiers.
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-muted"
        >
          {open ? "Show public version" : "Show full write-up →"}
        </button>
      </div>
      {open && <div className="mt-8">{children}</div>}
    </div>
  );
}
