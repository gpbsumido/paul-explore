"use client";

import type { WorkFeature } from "../_data/types";

/**
 * Placeholder demo. Every catalog entry points here until its real demo
 * ships, which is what lets the demo PRs land in any order.
 */
export default function ComingSoonDemo({ feature }: { feature: WorkFeature }) {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 text-center">
      <span aria-hidden className="text-3xl">
        {feature.icon}
      </span>
      <p className="text-[15px] font-semibold text-foreground">
        Demo in progress
      </p>
      <p className="max-w-sm text-[13px] text-muted">
        {feature.tagline}. The reconstruction for this one is on its way, the
        explainer has the full story in the meantime.
      </p>
    </div>
  );
}
