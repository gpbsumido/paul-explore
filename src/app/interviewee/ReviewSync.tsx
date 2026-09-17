"use client";

import { useState } from "react";
import {
  serializeReviewState,
  parseReviewState,
} from "@/lib/interviewee/reviewState";
import { useAnswered } from "./useAnswered";

/**
 * Move review progress between machines without a server. Reviewed state is
 * device-local (localStorage), so this exports it to a string I can carry and
 * imports one back, merging rather than replacing so a paste never wipes
 * progress already on this device.
 */
export default function ReviewSync() {
  const { reviewed, importReviewed } = useAnswered();
  const [paste, setPaste] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const exported = serializeReviewState(reviewed);

  const onCopy = () => {
    void navigator.clipboard?.writeText(exported);
    setStatus("Copied to clipboard.");
  };

  const onApply = () => {
    const parsed = parseReviewState(paste.trim());
    if (!parsed) {
      setStatus("That doesn't look like exported progress.");
      return;
    }
    importReviewed(parsed);
    const count = Object.keys(parsed).length;
    setStatus(`Merged ${count} reviewed ${count === 1 ? "topic" : "topics"}.`);
    setPaste("");
  };

  const fieldClass =
    "mt-1 w-full rounded-lg border border-border bg-surface-raised/50 px-3 py-2 font-mono text-xs text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500";
  const buttonClass =
    "mt-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500";

  return (
    <details className="mt-10 rounded-xl border border-border bg-surface p-4">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        Move review progress between devices
      </summary>
      <div className="mt-3 space-y-5 text-sm text-muted">
        <p>
          Reviewed state lives on this device. Copy it here, paste it on another
          machine, and Apply to merge.
        </p>

        <div>
          <label
            htmlFor="review-export"
            className="block font-medium text-foreground"
          >
            Export
          </label>
          <textarea id="review-export" readOnly rows={2} value={exported} className={fieldClass} />
          <button type="button" onClick={onCopy} className={buttonClass}>
            Copy
          </button>
        </div>

        <div>
          <label
            htmlFor="review-import"
            className="block font-medium text-foreground"
          >
            Import
          </label>
          <textarea
            id="review-import"
            rows={2}
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
            placeholder="Paste exported progress…"
            className={fieldClass}
          />
          <button type="button" onClick={onApply} className={buttonClass}>
            Apply
          </button>
        </div>

        {status ? (
          <p role="status" className="text-foreground">
            {status}
          </p>
        ) : null}
      </div>
    </details>
  );
}
