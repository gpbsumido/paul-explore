"use client";

import { useState } from "react";
import { Button, Input, Select, FilterBar } from "@/components/ui";
import {
  BUTTON_VARIANTS,
  BUTTON_SIZES,
  buildButtonSnippet,
  type ButtonPlaygroundState,
} from "./buttonSnippet";

/**
 * The interactive "controls" surface of the showcase. This is one of the few
 * genuinely stateful islands on the page, so it hydrates while the prose and
 * token tables around it stay server markup. It reads its variant/size lists
 * from the buttonSnippet leaf module, not catalog.ts, which keeps the full
 * component manifest out of the client bundle.
 */
export default function ButtonPlayground() {
  const [state, setState] = useState<ButtonPlaygroundState>({
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
    label: "Click me",
  });

  const set = <K extends keyof ButtonPlaygroundState>(
    key: K,
    value: ButtonPlaygroundState[K],
  ) => setState((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <FilterBar
          label="Button playground controls"
          className="flex-wrap gap-4"
        >
          <Select
            label="Variant"
            value={state.variant}
            onChange={(e) =>
              set("variant", e.target.value as ButtonPlaygroundState["variant"])
            }
          >
            {BUTTON_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
          <Select
            label="Size"
            value={state.size}
            onChange={(e) =>
              set("size", e.target.value as ButtonPlaygroundState["size"])
            }
          >
            {BUTTON_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FilterBar>

        <div className="flex flex-wrap items-center gap-5">
          <label className="paul-touch-min flex min-h-11 items-center gap-2 text-sm text-foreground sm:min-h-0">
            <input
              type="checkbox"
              checked={state.loading}
              onChange={(e) => set("loading", e.target.checked)}
              className="paul-touch-target h-4 w-4 accent-primary-500"
            />
            Loading
          </label>
          <label className="paul-touch-min flex min-h-11 items-center gap-2 text-sm text-foreground sm:min-h-0">
            <input
              type="checkbox"
              checked={state.disabled}
              onChange={(e) => set("disabled", e.target.checked)}
              className="paul-touch-target h-4 w-4 accent-primary-500"
            />
            Disabled
          </label>
        </div>

        <Input
          label="Label"
          value={state.label}
          onChange={(e) => set("label", e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex min-h-24 items-center justify-center rounded-xl border border-border bg-surface p-6">
          <Button
            variant={state.variant}
            size={state.size}
            loading={state.loading}
            disabled={state.disabled}
          >
            {state.label || "Button"}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-border bg-neutral-900 p-4 text-[13px] leading-relaxed text-neutral-100 dark:bg-black/60">
          <code>{buildButtonSnippet(state)}</code>
        </pre>
      </div>
    </div>
  );
}
