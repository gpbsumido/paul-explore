/** Relative luminance, per WCAG 2.x. */
function luminance(hex: string): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [1, 3, 5].map((i) =>
    channel(parseInt(hex.slice(i, i + 2), 16)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast between two six-digit hex colours. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Warm ink, matching --color-foreground in the light theme. */
const INK = "#1d1a15";
const WHITE = "#ffffff";

/**
 * The label colour that reads best on a given fill.
 *
 * A component that fills with a caller's colour cannot hardcode its label:
 * white is right on a dark accent and wrong on a light one, and the accents in
 * this palette span both. Rather than pick a side, measure — whichever of ink
 * or white has more contrast against the fill wins, which is correct for any
 * colour a caller passes rather than for the ones we happened to try.
 *
 * Returns undefined for anything that is not a six-digit hex, so a CSS variable
 * or a named colour falls back to whatever the caller was doing before instead
 * of being guessed at.
 */
export function readableOn(fill: string): string | undefined {
  if (!/^#[0-9a-fA-F]{6}$/.test(fill)) return undefined;
  return contrastRatio(WHITE, fill) >= contrastRatio(INK, fill) ? WHITE : INK;
}

/** Mixes a hex toward black by the given fraction. */
function darken(hex: string, amount: number): string {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `#${channels
    .map((c) =>
      Math.round(c * (1 - amount))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

const AA = 4.5;

/**
 * A fill and a label for it that are guaranteed to clear AA together.
 *
 * Choosing between ink and white is not always enough: a mid-tone accent can
 * fail against both, which is exactly what happened here. The design system's
 * own accent sits at 4.16:1 under white and lower under ink, so no choice of
 * label fixes it — the fill itself has to move. The hue is kept and the fill
 * is darkened only as far as it takes for white to clear, so a caller's colour
 * is still recognisably theirs.
 */
export function chipColors(fill: string): { background: string; color: string } | undefined {
  if (!/^#[0-9a-fA-F]{6}$/.test(fill)) return undefined;

  const label = readableOn(fill);
  if (label && contrastRatio(label, fill) >= AA) {
    return { background: fill, color: label };
  }

  for (let amount = 0.1; amount <= 0.7; amount += 0.05) {
    const darker = darken(fill, amount);
    if (contrastRatio(WHITE, darker) >= AA) {
      return { background: darker, color: WHITE };
    }
  }
  return { background: darken(fill, 0.7), color: WHITE };
}
