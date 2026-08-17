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
  /**
   * The row for the bracket currently being viewed.
   *
   * The light label is `primary-700` rather than `primary-600` because the
   * tint sits under it: 600 is 4.19:1 once the row is composited over the
   * card, and 4.03:1 on hover. 700 is the same hue one step down and clears
   * at 5.86:1 and 5.64:1. It is also exactly what the tokens package puts in
   * `on-primary-tint`, which is the token for this job, so the readable value
   * and the designed one turn out to be the same colour.
   */
  viewedUser: {
    row: "bg-primary-500/8 hover:bg-primary-500/12",
    label: "text-primary-700 dark:text-primary-400",
  },
} as const;
