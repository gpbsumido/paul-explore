"use client";

import { formatDistanceToNow } from "date-fns";
import type { AuditAction, AuditEntry } from "@/types/flags";

const ACTION_DOT: Record<AuditAction, string> = {
  enabled: "bg-success-500",
  disabled: "bg-neutral-400",
  "rollout-changed": "bg-warning-500",
};

/** A compact, newest-first trail of every flag change. */
export default function AuditLog({ audit }: { audit: AuditEntry[] }) {
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
          {audit.map((entry) => (
            <li key={entry.id} className="flex items-start gap-2.5">
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ACTION_DOT[entry.action]}`}
              />
              <div className="min-w-0">
                <p className="text-[13px] text-foreground">
                  {entry.summary}{" "}
                  <code className="text-[11px] text-muted">{entry.flagKey}</code>
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
    </section>
  );
}
