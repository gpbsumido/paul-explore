/**
 * The craft matrix behind the /craft feature: the traits a lead front-end
 * developer is measured on, each tied to concrete evidence already shipped in
 * this project. Nothing here is aspirational -- every evidence link points at a
 * real feature or write-up you can open, so the page argues from proof, not
 * from a bullet list of adjectives.
 */

/** A single "here's where I did this" link on a trait. */
export type CraftEvidence = {
  /** Short human label shown on the chip. */
  label: string;
  /** In-app route the chip links to. */
  href: string;
};

/** One lead-level competency, with the proof to back it. */
export type CraftTrait = {
  /** Stable slug, used for keys and the expand/collapse wiring. */
  id: string;
  /** Display name, e.g. "Performance". */
  title: string;
  /** One line that captures what owning this trait actually means. */
  principle: string;
  /** A short paragraph on what a lead does here, beyond the title. */
  detail: string;
  /** Accent hex, matched to the areas it draws evidence from. */
  color: string;
  /** The pages that prove it, most representative first. */
  evidence: CraftEvidence[];
};

export const CRAFT_TRAITS: CraftTrait[] = [
  {
    id: "performance",
    title: "Performance",
    principle: "Own the real-user number, not just the Lighthouse score.",
    detail:
      "A lead treats each Core Web Vital as a budget with a name on it. That means measuring real loads in the field, chasing the regression to its source, and knowing whether the win is in the bundle, the render, or the network.",
    color: "#f59e0b",
    evidence: [
      { label: "Web Vitals", href: "/vitals" },
      { label: "Perf pass", href: "/thoughts/perf" },
      { label: "Render perf", href: "/thoughts/render-perf" },
      { label: "Bundle analysis", href: "/thoughts/bundle" },
      { label: "Tree shaking", href: "/thoughts/tree-shaking" },
    ],
  },
  {
    id: "system-design",
    title: "System Design",
    principle: "Draw the boundaries before writing the components.",
    detail:
      "Deciding what renders on the server, what the client owns, and where state actually lives is the work. A lead restructures routes, layers a backend, and picks polling versus push based on the shape of the data, not the framework's defaults.",
    color: "#a78bfa",
    evidence: [
      { label: "Route restructure", href: "/thoughts/routing" },
      { label: "API backend overhaul", href: "/thoughts/api-backend-overhaul" },
      { label: "Operator dashboard", href: "/thoughts/operator-dashboard" },
    ],
  },
  {
    id: "libraries",
    title: "Working with Libraries",
    principle: "Add a dependency when it earns its weight, not before.",
    detail:
      "Knowing when Framer Motion is worth the bytes, when React Three Fiber pays for itself, and when a plain fetch beats reaching for Apollo. A lead reads the trade-off in both directions and can rip a heavy library back out when it stops earning its place.",
    color: "#38bdf8",
    evidence: [
      { label: "Motion Lab", href: "/lab/motion" },
      { label: "Particle Lab", href: "/lab/particles" },
      { label: "GraphQL over fetch", href: "/thoughts/graphql" },
      { label: "UI redesign", href: "/thoughts/ui-redesign" },
    ],
  },
  {
    id: "accessibility",
    title: "Accessibility",
    principle: "Ship WCAG AA by default, tested, not bolted on.",
    detail:
      "Semantic HTML first, ARIA only to fill the gaps, keyboard paths that actually work, and an automated axe scan in the suite so a regression fails the build. A lead knows where tooling helps and where it can't, and audits the primitives everything else is built from.",
    color: "#34d399",
    evidence: [
      { label: "Accessibility", href: "/thoughts/accessibility" },
      { label: "V3 a11y audit", href: "/thoughts/v3-redesign" },
    ],
  },
  {
    id: "testing",
    title: "Testing & Quality",
    principle: "TDD as the default, behavior as the contract.",
    detail:
      "Tests written first, aimed at behavior instead of implementation, backed by e2e coverage of the real flows and mutation testing to prove the tests would actually catch a break. A lead makes the CI signal trustworthy so green means green.",
    color: "#818cf8",
    evidence: [
      { label: "Testing", href: "/thoughts/testing" },
      { label: "E2E testing", href: "/thoughts/e2e" },
      { label: "CI E2E reliability", href: "/thoughts/ci-e2e" },
      { label: "React Doctor", href: "/thoughts/react-doctor" },
    ],
  },
  {
    id: "type-safety",
    title: "Type Safety",
    principle: "Strict types inside, schemas at the edges.",
    detail:
      "No any, no unearned assertions, and Zod validation at every trust boundary so bad input fails loud and early. A lead derives types from schemas rather than keeping the two in sync by hand.",
    color: "#0ea5e9",
    evidence: [
      { label: "API hardening", href: "/thoughts/improvements" },
      { label: "API backend overhaul", href: "/thoughts/api-backend-overhaul" },
    ],
  },
  {
    id: "design-systems",
    title: "Design Systems",
    principle: "Tokens and primitives that scale past one app.",
    detail:
      "Design tokens as CSS custom properties, thin framework wrappers over them, and shared components published so React and Angular apps stay in visual lockstep. A lead builds the system once and aliases it everywhere instead of re-styling per screen.",
    color: "#06b6d4",
    evidence: [
      { label: "Design system", href: "/thoughts/design-system" },
      { label: "Styling decisions", href: "/thoughts/styling" },
      { label: "UI redesign", href: "/thoughts/ui-redesign" },
    ],
  },
  {
    id: "security",
    title: "Security",
    principle: "Threat-model the surface, then close it.",
    detail:
      "A real Content Security Policy, fixed-window rate limiting, body-size caps on every route, and thinking through the new attack surface that AI tooling opens up. A lead knows which mitigation actually stops the attack and which just looks like it does.",
    color: "#ec4899",
    evidence: [
      { label: "CSP & security", href: "/thoughts/security" },
      { label: "AI security", href: "/thoughts/ai-security" },
      { label: "API hardening", href: "/thoughts/improvements" },
    ],
  },
  {
    id: "tooling",
    title: "Build & Tooling",
    principle: "Let the deliverable pick the bundler, not taste.",
    detail:
      "Choosing a bundler, a package manager, and a deploy target from the app's runtime shape and its dominant constraint. A lead can justify the migration, or justify not doing it, and knows the trade-offs that bite six months later.",
    color: "#a855f7",
    evidence: [
      { label: "Bundlers", href: "/thoughts/bundlers" },
      { label: "npm to pnpm", href: "/thoughts/npm-to-pnpm" },
      { label: "Deployment", href: "/thoughts/deployment" },
    ],
  },
  {
    id: "mentorship",
    title: "Mentorship & Review",
    principle: "Turn a review into something the team learns from.",
    detail:
      "Reading a whole codebase for the story it tells, separating severity from priority, and writing the review so the next person gets better instead of just getting a patch. A lead leaves the codebase and the team stronger than they found them.",
    color: "#64748b",
    evidence: [
      { label: "React Doctor", href: "/thoughts/react-doctor" },
      { label: "Project review", href: "/thoughts/project-review" },
    ],
  },
];
