import type { ReactNode } from "react";

/**
 * The filter row shown under the nav on the fantasy pages: a named landmark
 * (so its controls sit inside a region) plus the centered, wrapping row.
 * Replaces the border-b `<section>` + inner `<div>` copied across the pages.
 */
export default function FilterBar({
  label,
  children,
}: {
  /** Accessible name for the region (e.g. "Team and player filters"). */
  label: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={label} className="border-b border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
        {children}
      </div>
    </section>
  );
}
