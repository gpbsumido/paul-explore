"use client";

import type { Environment } from "@/types/flags";
import { ENVIRONMENTS } from "@/types/flags";

interface EnvironmentSwitcherProps {
  value: Environment;
  onChange: (env: Environment) => void;
}

const LABELS: Record<Environment, string> = {
  development: "Development",
  staging: "Staging",
  production: "Production",
};

/**
 * Segmented control for the active environment. Rendered as a radiogroup so
 * arrow keys and screen readers treat the three options as one exclusive
 * choice, matching how flags are configured per environment.
 */
export default function EnvironmentSwitcher({
  value,
  onChange,
}: EnvironmentSwitcherProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Environment"
      className="inline-flex rounded-lg border border-border bg-surface p-1"
    >
      {ENVIRONMENTS.map((env) => {
        const selected = env === value;
        return (
          <button
            key={env}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(env)}
            className={[
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
              selected
                ? "bg-primary-600 text-white"
                : "text-muted hover:text-foreground",
            ].join(" ")}
          >
            {LABELS[env]}
          </button>
        );
      })}
    </div>
  );
}
