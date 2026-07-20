"use client";

import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

const ACCENT = "var(--wp-accent, #fb7185)";

/**
 * Vignette: the UA referral-links tool. Type a handle to mint a referral
 * link, copy it, and watch a (simulated) click counter tick up, like the
 * original's public referral pages feeding attribution.
 */
export default function ReferralLinksDemo({ feature }: { feature: WorkFeature }) {
  const [handle, setHandle] = useState("nova");
  const [copied, setCopied] = useState(false);
  const [clicks, setClicks] = useState(0);

  const link = `play.example.gg/r/${handle.trim() || "you"}`;

  // Seed the counter off the handle, then tick it up like live referrals.
  useEffect(() => {
    const rng = makeRng(
      handle.split("").reduce((s, c) => s + c.charCodeAt(0), 0) || 1,
    );
    // defer off the synchronous effect path
    queueMicrotask(() => setClicks(roundish(20 + rng() * 200)));
    const timer = setInterval(() => {
      if (rng() > 0.4) setClicks((c) => c + 1);
    }, 1500);
    return () => clearInterval(timer);
  }, [handle]);

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <Input
        label="Your handle"
        size="sm"
        value={handle}
        onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
      />

      <div className="rounded-lg border border-border p-3">
        <p className="mb-1 text-[11px] uppercase tracking-wider text-muted">
          Referral link
        </p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded bg-black/5 px-2 py-1 font-mono text-[12px] text-foreground dark:bg-white/10">
            {link}
          </code>
          <button
            type="button"
            onClick={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="rounded-md px-2.5 py-1 text-[11px] font-medium text-white"
            style={{ backgroundColor: ACCENT }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted">Clicks</p>
          <p
            className="text-2xl font-bold text-foreground tabular-nums"
            data-testid="click-count"
          >
            {clicks.toLocaleString()}
          </p>
        </div>
        <p className="max-w-[45%] text-right text-[11px] text-muted">
          live count, attributed back to your campaign
        </p>
      </div>
    </div>
  );
}
