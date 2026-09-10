"use client";

import { GuidedTour, type GuidedTourStep } from "@paul-portfolio/react";
import { useGuidedTour } from "./useGuidedTour";
import type { TourStep } from "./types";

/**
 * Drop-in guided tour for a feature page: a "Take the tour" button plus the
 * overlay, wired to auto-open on a first visit. Give it a unique `storageKey`
 * so each feature remembers its own "seen" state, and the page's real steps.
 *
 * The overlay is the design-system `GuidedTour` from `@paul-portfolio/react`.
 * Steps map straight across, including the per-step `onEnter` a tour uses to
 * switch tabs (ZeroProof), so a page with `onEnter` steps must render this from
 * a client component.
 */
export default function FeatureTour({
  label,
  storageKey,
  steps,
  buttonClassName,
  buttonLabel = "Take the tour",
}: {
  label: string;
  storageKey: string;
  steps: TourStep[];
  buttonClassName?: string;
  buttonLabel?: string;
}) {
  const { open, start, close } = useGuidedTour(storageKey);

  return (
    <>
      <button
        type="button"
        onClick={start}
        className={
          buttonClassName ??
          "border-border bg-surface hover:border-primary-500/50 hover:bg-surface-raised text-foreground focus-visible:ring-primary-600 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        }
      >
        <span aria-hidden>🧭</span> {buttonLabel}
      </button>
      {open && (
        <GuidedTour
          open
          aria-label={`${label} tour`}
          steps={steps.map(
            (step): GuidedTourStep => ({
              target: step.anchor,
              title: step.title,
              body: step.body,
              onEnter: step.onEnter,
            }),
          )}
          onClose={close}
        />
      )}
    </>
  );
}
