"use client";

import { useId, useState } from "react";
import type { Environment, Flag, RolloutWeight } from "@/types/flags";
import {
  statusOf,
  exposurePercent,
  hasTargeting,
  variationName,
  kindLabel,
  type StatusTone,
} from "@/lib/flags-utils";
import Switch from "./Switch";

interface FlagCardProps {
  flag: Flag;
  environment: Environment;
  pending: boolean;
  onToggle: (enabled: boolean) => void;
  onRollout: (fallthrough: RolloutWeight[]) => void;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  off: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  on: "bg-success-100 text-success-700 dark:bg-success-950/50 dark:text-success-400",
  partial:
    "bg-warning-100 text-warning-700 dark:bg-warning-950/50 dark:text-warning-400",
};

/** A single flag's card for the active environment, with live controls. */
export default function FlagCard({
  flag,
  environment,
  pending,
  onToggle,
  onRollout,
}: FlagCardProps) {
  const config = flag.environments[environment];
  const sliderId = useId();

  if (!config) return null;

  const status = statusOf(config);
  const isBoolean = flag.kind === "boolean";
  const exposure = exposurePercent(config);

  return (
    <article className="glass-card flex flex-col gap-3 rounded-xl border border-border p-4">
      {/* Header: name + kill switch */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-foreground">
            {flag.name}
          </h3>
          <div className="flex items-center gap-1.5">
            <code className="text-[11px] text-muted">{flag.key}</code>
            <span className="rounded-full bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
              {kindLabel(flag.kind)}
            </span>
          </div>
        </div>
        <Switch
          checked={config.enabled}
          disabled={pending}
          onChange={onToggle}
          label={`Enable ${flag.name} in ${environment}`}
        />
      </div>

      <p className="text-[13px] leading-relaxed text-muted">
        {flag.description}
      </p>

      {/* Status + tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_CLASSES[status.tone]}`}
        >
          {status.label}
        </span>
        {flag.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-surface-raised px-2 py-0.5 text-[11px] text-muted"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Targeting summary */}
      {hasTargeting(config) && (
        <ul className="space-y-1 rounded-lg bg-surface-raised/60 p-2.5 text-[12px]">
          {config.rules.map((rule) => (
            <li key={rule.id} className="flex items-baseline gap-2">
              <span aria-hidden className="text-muted">
                →
              </span>
              <span className="text-foreground">
                {rule.description}{" "}
                <span className="text-muted">
                  serves {variationName(flag, rule.serve)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Rollout control */}
      {isBoolean ? (
        <div className={config.enabled ? "" : "opacity-50"}>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor={sliderId} className="text-[12px] text-muted">
              Fallthrough rollout
            </label>
            <span className="text-[12px] font-medium tabular-nums text-foreground">
              {exposure}% on
            </span>
          </div>
          <RolloutSlider
            id={sliderId}
            value={exposure}
            disabled={pending || !config.enabled}
            label={`Rollout percentage for ${flag.name} in ${environment}`}
            onCommit={(percent) =>
              onRollout([
                { variation: "on", weight: percent },
                { variation: "off", weight: 100 - percent },
              ])
            }
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[12px] text-muted">Traffic split</p>
          {config.fallthrough.map((slice) => (
            <VariationBar
              key={slice.variation}
              name={variationName(flag, slice.variation)}
              weight={slice.weight}
            />
          ))}
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Rollout slider — keeps a local draft while dragging, commits on release.
// ---------------------------------------------------------------------------

function RolloutSlider({
  id,
  value,
  disabled,
  label,
  onCommit,
}: {
  id: string;
  value: number;
  disabled: boolean;
  label: string;
  onCommit: (percent: number) => void;
}) {
  const [draft, setDraft] = useState<number | null>(null);
  const shown = draft ?? value;

  const commit = () => {
    if (draft !== null && draft !== value) onCommit(draft);
    setDraft(null);
  };

  return (
    <input
      id={id}
      type="range"
      min={0}
      max={100}
      step={5}
      value={shown}
      disabled={disabled}
      aria-label={label}
      aria-valuetext={`${shown} percent`}
      onChange={(e) => setDraft(Number(e.target.value))}
      onPointerUp={commit}
      onKeyUp={commit}
      onBlur={commit}
      className="w-full accent-primary-600 disabled:cursor-not-allowed"
    />
  );
}

function VariationBar({ name, weight }: { name: string; weight: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 truncate text-[11px] text-foreground">
        {name}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-primary-500"
          style={{ width: `${weight}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted">
        {weight}%
      </span>
    </div>
  );
}
