/**
 * The two highlighted leaderboard row states, kept as the literal classes the
 * row renders.
 *
 * They live here rather than inline so the contrast guard can read exactly what
 * the table paints. Building these strings from a ramp name and a step would be
 * tidier to look at and would break the build silently, because Tailwind only
 * generates a utility it can see written out, so they stay literal.
 */
export const LEADERBOARD_ROW_STATES = {
  /** The signed-in user's own row. */
  currentUser: {
    row: "bg-secondary-500/10 hover:bg-secondary-500/15",
    label: "text-secondary-700 dark:text-secondary-400",
  },
  /** The row for the bracket currently being viewed. */
  viewedUser: {
    row: "bg-primary-500/8 hover:bg-primary-500/12",
    label: "text-primary-600 dark:text-primary-400",
  },
} as const;
