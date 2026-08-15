/**
 * The six apps the landing puts forward, and the one line each gets there.
 *
 * Title, route and accent all come from FEATURES so there is still one source
 * of truth for them. Only the pitch lives here: the hub descriptions are
 * written to sit in a card grid with room to breathe, and a landing section
 * wants a single clause that says why a hiring manager should care.
 */

/** A curated feature id paired with its landing-page pitch and cell width. */
export type FeaturedPick = {
  /** Matches a FEATURES entry id. */
  id: string;
  /** One clause. No second sentence, no dash. */
  pitch: string;
  /** Bento column span at md and up, out of six. */
  span: 2 | 3 | 4;
};

/**
 * Ordered by what each one proves, strongest claim first: professional work,
 * then the number that keeps the whole site honest, then the system, the
 * console, the release tooling, and the showpiece to close.
 */
export const FEATURED: FeaturedPick[] = [
  {
    id: "work-portfolio",
    pitch:
      "Twenty-two reconstructions of features I shipped on products with real users, rebuilt here so you can click through them instead of taking a bullet point's word for it.",
    span: 4,
  },
  {
    id: "vitals",
    pitch: "Real Core Web Vitals from this domain, aggregated to P75.",
    span: 2,
  },
  {
    id: "design-system",
    pitch: "The tokens and primitives this site and an Angular app both use.",
    span: 3,
  },
  {
    id: "operator",
    pitch: "A retail fleet console: live alerts, inventory health, drill-down.",
    span: 3,
  },
  {
    id: "flags",
    pitch: "Targeting rules, sticky rollouts and a kill switch, with an audit log.",
    span: 2,
  },
  {
    id: "world",
    pitch:
      "A low-poly Toronto you walk through with WASD, built in React Three Fiber and streamed in only when the canvas is near the viewport.",
    span: 4,
  },
];

/** One write-up the landing may put forward, with the reason it earns the slot. */
export type WritingPick = {
  href: string;
  pitch: string;
};

/**
 * The pool the shortlist is drawn from. Curation happens here, not in the
 * draw: everything in this list sells the same argument, so randomizing the
 * selection changes the read without ever weakening it.
 */
export const WRITING_POOL: WritingPick[] = [
  {
    href: "/thoughts/craft",
    pitch:
      "What separates a lead from a senior, trait by trait, with the work that backs each one.",
  },
  {
    href: "/thoughts/test-tiers",
    pitch:
      "Why the suite splits into unit, integration and end to end, and what each tier is allowed to know.",
  },
  {
    href: "/thoughts/render-perf",
    pitch:
      "Chasing a render regression to its source instead of scattering memo calls and hoping.",
  },
  {
    href: "/thoughts/tree-shaking-2",
    pitch:
      "A second pass at the bundle, because the first one left kilobytes on the table and said so.",
  },
  {
    href: "/thoughts/security-audit",
    pitch:
      "Auditing my own site the way an attacker would read it, and fixing what that turned up.",
  },
  {
    href: "/thoughts/accessibility",
    pitch:
      "Making axe part of the definition of done instead of a checkbox at the end.",
  },
  {
    href: "/thoughts/api-backend-overhaul",
    pitch:
      "Rebuilding the API layer under a live site without anyone noticing from the outside.",
  },
  {
    href: "/thoughts/bundle",
    pitch:
      "Reading the bundle analyzer like a bill and deciding which dependencies earn their weight.",
  },
];

/** How many write-ups the landing shows at once. */
export const WRITING_SHOWN = 5;

/**
 * Public path of a featured card's hover preview, one screenshot per theme.
 * A guard test checks the files exist so a rename cannot 404 under a hover
 * state nobody re-checks.
 */
export function previewSrc(id: string, theme: "light" | "dark"): string {
  return `/landing/featured/${id}-${theme}.jpg`;
}

/**
 * Draws the shortlist from the pool: a Fisher-Yates shuffle with the
 * randomness injected, trimmed to the shown count.
 * @param random A function returning a number in [0, 1), called per swap.
 */
export function pickWriting(random: () => number): string[] {
  const deck = WRITING_POOL.map((pick) => pick.href);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)) % (i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, WRITING_SHOWN);
}
