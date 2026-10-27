// Shared by player A's and player B's screens, so the two never drift apart.
// ts-prune-ignore-next -- imported by .svelte files, which ts-prune can't see
export const BUTTON =
  "paul-touch-min rounded-md border border-border px-4 py-2 font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500";

// ts-prune-ignore-next -- imported by .svelte files, which ts-prune can't see
export const PRIMARY_BUTTON =
  "paul-touch-min rounded-md bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500";
