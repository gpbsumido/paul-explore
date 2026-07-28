/**
 * Where each name sits in the chalk backdrop, and when it writes itself in.
 *
 * Deterministic, like the confetti: positions come from a hash of the label, not
 * `Math.random()`, so the server and the first client pass agree. It still looks
 * scattered because the hash is.
 */

function hash01(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 4096) / 4096;
}

export type ChalkWord = {
  id: string;
  label: string;
  /** Percentage across the viewport. */
  left: number;
  /** Percentage down the viewport. */
  top: number;
  /** Slight tilt, in degrees, so nothing sits on a grid. */
  rotate: number;
  /** Font size in rem. */
  size: number;
  /** When this word starts writing itself, in ms. */
  delay: number;
  /** How long one write-hold-fade cycle takes, in ms. */
  duration: number;
  /**
   * Dash length for the trace, in user units. Has to exceed the glyph outline's
   * total length or the dashes repeat and the word reveals in chunks instead of
   * being drawn, so it scales with the label.
   */
  dash: number;
};

/**
 * Place a word for its slot.
 *
 * Both axes are spaced by *index*, not by hash, with only a little hash jitter
 * on top. Hashing looked scattered in principle but clumped in practice -- with
 * a dozen words there is nothing forcing them apart, so they piled onto one
 * side and above the machine. Alternating bands guarantees the spread; the
 * jitter keeps it from reading as a grid.
 *
 * The middle of the screen belongs to the reels, so the bands sit clear of it:
 * even indices go above, odd indices below.
 */
function place(index: number, total: number, seedX: number, seedY: number) {
  const band = 100 / Math.max(1, total);
  const left = Math.min(
    96,
    Math.max(4, band * (index + 0.5) + (seedX - 0.5) * band * 0.7),
  );
  // Alternate above and below, so the backdrop frames the machine rather than
  // sitting entirely over it.
  const above = index % 2 === 0;
  const top = above ? 5 + seedY * 26 : 68 + seedY * 26;
  return { left, top };
}

/**
 * Lay out one word per label. `spread` staggers the whole set so they don't all
 * begin together -- the point is that some are being written while others are
 * already fading.
 */
export function chalkLayout(
  labels: readonly string[],
  spread = 9000,
): ChalkWord[] {
  return labels.map((label, i) => {
    const a = hash01(`${label}:x`);
    const b = hash01(`${label}:y`);
    const c = hash01(`${label}:t`);
    const { left, top } = place(i, labels.length, a, b);
    return {
      id: `${label}-${i}`,
      label,
      left,
      top,
      rotate: (a - 0.5) * 14,
      size: 1.05 + c * 1.15,
      // Spread across the whole cycle, plus a per-word offset, so the page is
      // never briefly empty and never writes everything at once.
      delay: (i / Math.max(1, labels.length)) * spread + c * 1200,
      duration: 7000 + b * 5000,
      dash: 260 * label.length + 400,
    };
  });
}
