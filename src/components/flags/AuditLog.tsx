"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { AuditAction, AuditEntry } from "@/types/flags";

const ACTION_DOT: Record<AuditAction, string> = {
  enabled: "bg-success-500",
  disabled: "bg-neutral-400",
  "rollout-changed": "bg-warning-500",
};

const PAGE_SIZE = 6;

/**
 * A compact, newest-first trail of every flag change, paginated so a long log
 * doesn't push the rest of the console off the page.
 */
export default function AuditLog({ audit }: { audit: AuditEntry[] }) {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(audit.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const start = current * PAGE_SIZE;
  const visible = audit.slice(start, start + PAGE_SIZE);
  const showPager = audit.length > PAGE_SIZE;

  return (
    <section
      aria-labelledby="audit-heading"
      className="glass-card rounded-xl border border-border p-4 sm:p-5"
    >
      <h2
        id="audit-heading"
        className="text-[15px] font-semibold text-foreground"
      >
        Audit log
      </h2>
      <p className="mt-1 text-[13px] text-muted">
        Every change is recorded — who, what, and when.
      </p>

      {audit.length === 0 ? (
        <p className="mt-4 text-[13px] text-muted">No changes yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {visible.map((entry) => (
            <li key={entry.id} className="flex items-start gap-2.5">
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ACTION_DOT[entry.action]}`}
              />
              <div className="min-w-0">
                <p className="text-[13px] text-foreground">
                  {entry.summary}{" "}
                  <code className="text-[11px] text-muted">
                    {entry.flagKey}
                  </code>
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {entry.actor} ·{" "}
                  <time dateTime={entry.timestamp}>
                    {formatDistanceToNow(new Date(entry.timestamp), {
                      addSuffix: true,
                    })}
                  </time>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {showPager && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-[12px] tabular-nums text-muted">
            {start + 1}–{start + visible.length} of {audit.length}
          </span>
          <div className="flex gap-2">
            <PagerButton
              label="Previous"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            />
            <PagerButton
              label="Next"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function PagerButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-border bg-surface px-2.5 py-1 text-[12px] font-medium text-foreground transition-colors hover:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
