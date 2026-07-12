"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ToolCallStep } from "@/lib/agent/types";

type ToolCallCardProps = {
  readonly step: ToolCallStep;
  readonly defaultExpanded?: boolean;
};

function StatusIndicator({ status }: { status: ToolCallStep["status"] }) {
  switch (status) {
    case "running":
      return (
        <span
          data-testid="status-running"
          className="inline-block h-4 w-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"
          aria-label="Running"
        />
      );
    case "done":
      return (
        <span
          data-testid="status-done"
          className="inline-flex items-center justify-center h-4 w-4 text-green-600"
          aria-label="Completed"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M3 8.5l3.5 3.5 6.5-7" />
          </svg>
        </span>
      );
    case "error":
      return (
        <span
          data-testid="status-error"
          className="inline-flex items-center justify-center h-4 w-4 text-red-600"
          aria-label="Error"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </span>
      );
  }
}

/**
 * Expandable card displaying a tool call's name, status,
 * input parameters, and result or error message.
 */
export function ToolCallCard({
  step,
  defaultExpanded = false,
}: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-border rounded-lg bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm font-medium
                   bg-transparent text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800
                   transition-colors cursor-pointer"
      >
        <StatusIndicator status={step.status} />
        <span>{step.name}</span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 text-sm">
              <pre className="bg-surface-raised rounded p-2 text-xs overflow-x-auto">
                {JSON.stringify(step.input, null, 2)}
              </pre>

              {step.status === "done" && step.result && (
                <p className="text-foreground-secondary">{step.result}</p>
              )}

              {step.status === "error" && step.error && (
                <p data-error="" className="text-red-600">
                  {step.error}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
