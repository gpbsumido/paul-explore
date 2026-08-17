import { describe, it, expect } from "vitest";
import { colors, semanticColors } from "@paul-portfolio/tokens";
import { contrastRatio } from "@/components/ui/readableOn";
import { LEADERBOARD_ROW_STATES } from "../leaderboardRowStates";

/**
 * The leaderboard's two highlighted rows put coloured text on a tinted row, and
 * a tint is the case a contrast check is most likely to get wrong: the label is
 * not on the page background, it is on an accent composited over the card. Read
 * the token values and it passes. Composite the tint in first and it does not.
 *
 * jsdom cannot compute this -- axe's contrast rule needs a real painted page, and
 * the Playwright scan that does have one runs nightly rather than on a PR. So
 * this does the arithmetic instead, over the same class strings the row renders,
 * which is the part that keeps it honest: change the classes and this re-measures
 * whatever they now say rather than whatever they said when it was written.
 */

const AA = 4.5;

/** The row sits inside a `bg-surface` card, so that is what the tint lands on. */
const BACKDROP = {
  light: semanticColors.light.surface,
  dark: semanticColors.dark.surface,
} as const;

function token(ramp: string, step: string): string {
  const family = (colors as Record<string, Record<string, string> | undefined>)[
    ramp
  ];
  const value = family?.[step];
  if (!value) throw new Error(`No such token: ${ramp}-${step}`);
  return value;
}

/** Flattens a colour at the given alpha onto an opaque backdrop. */
function composite(fill: string, alpha: number, backdrop: string): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return `#${[1, 3, 5]
    .map((i) =>
      Math.round(alpha * channel(fill, i) + (1 - alpha) * channel(backdrop, i)),
    )
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** `bg-primary-500/8 hover:bg-primary-500/12` -> the two tints it describes. */
function tints(rowClasses: string) {
  const matches = [...rowClasses.matchAll(/(hover:)?bg-([a-z]+)-(\d+)\/(\d+)/g)];
  expect(matches.length).toBeGreaterThan(0);
  return matches.map((m) => ({
    state: m[1] ? "hover" : "rest",
    fill: token(m[2], m[3]),
    alpha: Number(m[4]) / 100,
  }));
}

/** `text-primary-600 dark:text-primary-400` -> the colour per theme. */
function labels(labelClasses: string) {
  const matches = [...labelClasses.matchAll(/(dark:)?text-([a-z]+)-(\d+)/g)];
  expect(matches.length).toBeGreaterThan(0);
  return matches.map((m) => ({
    theme: (m[1] ? "dark" : "light") as keyof typeof BACKDROP,
    color: token(m[2], m[3]),
  }));
}

describe("leaderboard highlighted rows", () => {
  for (const [name, state] of Object.entries(LEADERBOARD_ROW_STATES)) {
    for (const label of labels(state.label)) {
      for (const tint of tints(state.row)) {
        it(`${name}: label clears AA on the ${tint.state} tint in ${label.theme}`, () => {
          const background = composite(
            tint.fill,
            tint.alpha,
            BACKDROP[label.theme],
          );
          const ratio = contrastRatio(label.color, background);
          expect(
            Number(ratio.toFixed(2)),
            `${label.color} on ${background} (${tint.fill} at ${tint.alpha} over ${BACKDROP[label.theme]})`,
          ).toBeGreaterThanOrEqual(AA);
        });
      }
    }
  }
});
