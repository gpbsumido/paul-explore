/**
 * The one horizontal frame every v5 section sits in.
 *
 * Kept as a constant rather than repeated per section so the page cannot drift
 * a gutter, which is the kind of thing nobody notices until two sections are
 * side by side in a screenshot.
 */
export const SHELL = "mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12";

/** Vertical rhythm for a below-the-fold section. */
export const BAND = "py-20 sm:py-28";
