import type { ButtonVariant, ButtonSize } from "@/components/ui/Button";

/**
 * The button playground's own little vocabulary. It lives in this leaf module
 * rather than in catalog.ts because the playground island is client code and
 * the catalog is deliberately server-only: a function can't cross the
 * server/client boundary as a prop, and pulling catalog.ts into the island
 * would drag the whole 27KB component manifest back into the bundle this page
 * just shed. catalog.ts re-exports these, so its public surface is unchanged.
 */

/** The live state driven by the Button playground controls. */
export type ButtonPlaygroundState = {
  variant: ButtonVariant;
  size: ButtonSize;
  loading: boolean;
  disabled: boolean;
  label: string;
};

export const BUTTON_VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "danger",
];

export const BUTTON_SIZES: ButtonSize[] = ["xs", "sm", "md", "lg"];

/**
 * Turns the playground state into the exact JSX a developer would write. Props
 * left at their component defaults (primary/md, no loading/disabled) are
 * omitted so the snippet reads like real, minimal code rather than an
 * exhaustive prop dump.
 */
export function buildButtonSnippet(state: ButtonPlaygroundState): string {
  const parts: string[] = [];
  if (state.variant !== "primary") parts.push(`variant="${state.variant}"`);
  if (state.size !== "md") parts.push(`size="${state.size}"`);
  if (state.loading) parts.push("loading");
  if (state.disabled) parts.push("disabled");

  const attrs = parts.length > 0 ? ` ${parts.join(" ")}` : "";
  return `<Button${attrs}>${state.label}</Button>`;
}
