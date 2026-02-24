/** Shared label class used across all form field primitives (Input, Textarea). */
export const LABEL_CLASS = "block text-sm font-medium text-foreground mb-1.5";

/**
 * Builds the base className for a form field element (<input> or <textarea>).
 * Pass `extra` for element-specific additions (e.g. "py-1" for sm Input, "py-2 resize-none" for Textarea).
 */
export function fieldClass(error?: string, extra?: string): string {
  return [
    "block w-full rounded-lg border px-3 text-sm",
    "bg-surface text-foreground placeholder:text-muted",
    "transition-colors",
    "focus:outline-2 focus:outline-offset-0 focus:outline-primary-500 focus:border-primary-500",
    error
      ? "border-error-500 focus:outline-error-500 focus:border-error-500"
      : "border-border",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Builds the aria-describedby string from a list of optional IDs.
 * Filters out null/undefined, returns undefined if nothing remains.
 */
export function buildDescribedBy(
  ...ids: Array<string | null | undefined>
): string | undefined {
  return ids.filter(Boolean).join(" ") || undefined;
}
