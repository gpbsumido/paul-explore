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

export const FEATURED: FeaturedPick[] = [
  {
    id: "world",
    pitch:
      "A low-poly Toronto you walk through with WASD, built in React Three Fiber and streamed in only when the canvas is near the viewport.",
    span: 4,
  },
  {
    id: "work-portfolio",
    pitch: "Reconstructions of features I shipped on products that had users.",
    span: 2,
  },
  {
    id: "operator",
    pitch: "A retail fleet console: live alerts, inventory health, drill-down.",
    span: 3,
  },
  {
    id: "learn",
    pitch: "Algorithms and frontend patterns you step through, not read about.",
    span: 3,
  },
  {
    id: "design-system",
    pitch: "The tokens and primitives this site and an Angular app both use.",
    span: 2,
  },
  {
    id: "vitals",
    pitch:
      "Core Web Vitals collected from real page loads on this domain and aggregated to P75, which is the only performance number that settles an argument.",
    span: 4,
  },
];

/** The three write-ups the landing puts forward, with the reason each is there. */
export const FEATURED_WRITING: { href: string; pitch: string }[] = [
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
];
