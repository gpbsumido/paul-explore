/**
 * The raw feature and write-up data, deliberately free of components.
 *
 * This used to live in `featureData.tsx` alongside the preview components,
 * which meant a `"use client"` module importing framer-motion. Anything wanting
 * the feature list -- the v3 graph data, the v4 slot data, the header's
 * feature/write-up link -- had to pull that whole graph in, and no server
 * component could read it at all. The data has no JSX in it, so it lives here
 * as a plain module and the components import it.
 */

import type { FeatureItem, ThoughtItem } from "@/types/hub";

export const FEATURES: FeatureItem[] = [
  {
    id: "work-portfolio",
    title: "Work Portfolio",
    description:
      "Interactive reconstructions of features shipped on past products: dashboards, marketing tooling, onboarding flows, and more, browsable through dual tickers.",
    href: "/work-portfolio",
    color: "#60a5fa",
    thoughtsHref: "/thoughts/work-portfolio",
  },
  {
    id: "world",
    title: "Explore Toronto",
    description:
      "A 3D low-poly downtown Toronto you walk through like an RPG \u2014 steer an explorer with WASD past the CN Tower and City Hall to glowing exhibits that open every feature on this site.",
    href: "/world",
    color: "#38bdf8",
    thoughtsHref: "/thoughts/world",
  },
  {
    id: "design-system",
    title: "Design System",
    description:
      "A live, Storybook-style gallery of the shared @paul-portfolio design system — every primitive rendered interactively, a props playground, design tokens, and links to where each ships.",
    href: "/design-system",
    color: "#06b6d4",
    thoughtsHref: "/thoughts/design-system-showcase",
  },
  {
    id: "research",
    title: "Research Explorer",
    description:
      "A tool for picking a vascular surgery research project: curated topics scored live against PubMed, recent papers with links, journal browsing, and the demographic gaps in who the existing studies actually enrolled.",
    href: "/research",
    color: "#14b8a6",
    thoughtsHref: "/thoughts/research-explorer",
  },
  {
    id: "flags",
    title: "Feature Flags",
    description:
      "A flag-management console — per-environment targeting rules, sticky percentage rollouts, a kill switch, an audit log, and a live evaluation playground on a deterministic engine.",
    href: "/flags",
    color: "#fb923c",
    thoughtsHref: "/thoughts/feature-flags",
  },
  {
    id: "operator",
    title: "Operator Dashboard",
    description:
      "Manage a smart-store retail fleet — live status, alerts, inventory health, analytics charts, and per-store drill-down.",
    href: "/operator",
    color: "#8b5cf6",
    thoughtsHref: "/thoughts/operator-dashboard",
  },
  {
    id: "vitals",
    title: "Web Vitals",
    description:
      "Real-user Core Web Vitals (LCP, CLS, FCP, INP, TTFB) collected from every page load and aggregated into P75 scores by metric and by page.",
    href: "/vitals",
    color: "#22c55e",
    thoughtsHref: "/thoughts/vitals",
  },
  {
    id: "learn",
    title: "Learn",
    description:
      "Interactive deep-dives into algorithms and frontend patterns. Build real intuition, not memorized templates.",
    href: "/learn",
    color: "#34d399",
    thoughtsHref: "/thoughts/learn",
  },
  {
    id: "craft",
    title: "Craft",
    description:
      "The traits of a lead front-end developer — performance, system design, working with libraries, accessibility, testing, and more — each one expandable to the real work in this project that proves it.",
    href: "/craft",
    color: "#c084fc",
    thoughtsHref: "/thoughts/craft",
  },
  {
    id: "gallery-wall",
    title: "Gallery Wall",
    description:
      "Upload your photos and arrange a picture gallery wall. Each photo is auto-framed with the best size and orientation, every frame is yours to change, and the whole wall renders to scale against a wall size you enter.",
    href: "/gallery-wall",
    color: "#e879f9",
    thoughtsHref: "/thoughts/gallery-wall",
  },
  {
    id: "fantasy-nba",
    title: "Fantasy NBA",
    description:
      "Everything NBA in one place: a playoff bracket picker with a public leaderboard, live player stats, head-to-head matchups with predictions, an SVG shot chart, and ESPN league history.",
    href: "/fantasy/nba",
    color: "#f43f5e",
    thoughtsHref: "/thoughts/playoffs",
  },
  {
    id: "pokemon",
    title: "Pokémon",
    description:
      "Three Pokémon apps behind one door: the TCG card browser, the TCG Pocket expansions, and a GraphQL Pokédex on the PokeAPI endpoint.",
    href: "/pokemon",
    color: "#ef4444",
    thoughtsHref: "/thoughts/tcg",
  },
  {
    id: "calendar",
    title: "Calendar",
    description:
      "Four-view personal calendar backed by Postgres. Multi-day events, overlap layout engine, and Pokémon card attachments.",
    href: "/calendar",
    color: "#f59e0b",
    thoughtsHref: "/thoughts/calendar",
  },
  {
    id: "particles",
    title: "Particle Lab",
    description:
      "Interactive R3F particle network with real-time controls: speed, connection distance, 5 pastel color themes, mouse attraction toggle.",
    href: "/lab/particles",
    color: "#a5f3fc",
    thoughtsHref: "/thoughts/particles",
  },
  {
    id: "ketsup",
    title: "Ketsup",
    description:
      "A social app for image and text posts — think Instagram but simpler. Built and deployed at its own domain.",
    href: "https://ketsup.paulsumido.com",
    color: "#f9a8d4",
    thoughtsHref: "/thoughts/ketsup",
  },
];

export const THOUGHTS: ThoughtItem[] = [
  {
    title: "Learn",
    href: "/thoughts/learn",
    preview:
      "Thirteen demos that each rebuilt the same stepper, one useStepPlayer hook, and the overrun the characterisation tests caught",
    color: "#22d3ee",
  },
  {
    title: "Particle Lab",
    href: "/thoughts/particles",
    preview:
      "Two point clouds instead of an object per particle, and why the connection-distance slider is really the performance dial",
    color: "#a5f3fc",
  },
  {
    title: "Research Explorer",
    href: "/thoughts/research-explorer",
    preview:
      "Finding a research topic by measuring the literature: PubMed counts as evidence levels, a curated query layer, and demographic coverage as the gap finder",
    color: "#14b8a6",
  },
  {
    title: "TypeScript 7",
    href: "/thoughts/typescript-7",
    preview:
      "Why the Go-native compiler is a no for now: the lint stack peer-caps below it, and a 4-second type-check makes the 10x moot",
    color: "#3178c6",
  },
  {
    title: "React Doctor",
    href: "/thoughts/react-doctor",
    preview:
      "Working a static-analysis pass: real fixes, the fix that fought back, false positives, and why severity isn't priority",
    color: "#f43f5e",
  },
  {
    title: "Styling Decisions",
    href: "/thoughts/styling",
    preview: "CSS Modules vs Tailwind v4 and design tokens",
    color: "#007aff",
  },
  {
    title: "Landing Page",
    href: "/thoughts/landing-page",
    preview: "Section layout and functionality preview",
    color: "#FF7373",
  },
  {
    title: "Search Bar",
    href: "/thoughts/search-bar",
    preview: "Server/client split, filtering, and trade-offs",
    color: "#5856d6",
    deprecated: true,
  },
  {
    title: "TCG Pages",
    href: "/thoughts/tcg",
    preview: "API proxy, server/client split, pagination patterns",
    color: "#10b981",
  },
  {
    title: "Calendar",
    href: "/thoughts/calendar",
    preview: "Views, timezone handling, BFF auth pattern",
    color: "#f59e0b",
  },
  {
    title: "NBA Playoffs Bracket",
    href: "/thoughts/playoffs",
    preview:
      "TDD with MSW, derived state, TBD resolution, submit vs. auto-save design, and leaderboard before results",
    color: "#f43f5e",
  },
  {
    title: "GraphQL",
    href: "/thoughts/graphql",
    preview: "Why GraphQL, why plain fetch over Apollo",
    color: "#6366f1",
  },
  {
    title: "Bundle Analysis",
    href: "/thoughts/bundle",
    preview:
      "How the analyzer found Auth0Provider shipping jose to the browser for no reason",
    color: "#f97316",
  },
  {
    title: "CSP & Security",
    href: "/thoughts/security",
    preview:
      "Why 'unsafe-inline' is the right call for Next.js static pages, and what actually prevents XSS",
    color: "#ec4899",
  },
  {
    title: "UI Redesign",
    href: "/thoughts/ui-redesign",
    preview:
      "Why CSS keyframes gave way to Framer Motion, where Three.js went, and what's actually measurably better",
    color: "#a7f3d0",
  },
  {
    title: "Route Restructure",
    href: "/thoughts/routing",
    preview:
      "Why / replaced /protected, the force-static trade-off, and how auth is still enforced",
    color: "#64748b",
  },
  {
    title: "Ketsup",
    href: "/thoughts/ketsup",
    preview:
      "A social app for image and text posts, built and shipped at its own domain",
    color: "#f9a8d4",
  },
  {
    title: "API Hardening",
    href: "/thoughts/improvements",
    preview:
      "Zod validation, fixed-window rate limiting, and body size limits across every API route",
    color: "#34d399",
  },
  {
    title: "Testing",
    href: "/thoughts/testing",
    preview:
      "640+ tests (623 unit + 17 e2e), Vitest + MSW + Playwright, and the delay() trick for proving optimistic updates fire before the server responds",
    color: "#818cf8",
  },
  {
    title: "Performance Improvements",
    href: "/thoughts/perf",
    preview:
      "Eliminating the dark-mode flash, ISR on static pages, lazy-loading below-fold sections, and caching public API routes",
    color: "#f97316",
  },
  {
    title: "Login Redirect",
    href: "/thoughts/login-redirect",
    preview:
      "Landing back on the route you logged in from, and turning a denied consent screen from a bare 500 into a toast, both fixed at the Auth0 choke point",
    color: "#eb5424",
  },
  {
    title: "Messenger Auth Bug",
    href: "/thoughts/messenger-auth",
    preview:
      "Why links opened in Facebook Messenger showed a logged-in hub for unauthenticated users, and the two-line fix",
    color: "#3b82f6",
    deprecated: true,
  },
  {
    title: "Web Vitals",
    href: "/thoughts/vitals",
    preview: "Real-user metrics, sendBeacon, P75, and the collection pipeline",
    color: "#22c55e",
  },
  {
    title: "CI E2E Reliability",
    href: "/thoughts/ci-e2e",
    preview:
      "Auth0 crashing all middleware from a module-level throw, and a search test that needed page.route to stop depending on an external API",
    color: "#06b6d4",
  },
  {
    title: "PR Screenshots From an Unattended Agent",
    href: "/thoughts/pr-screenshots",
    preview:
      "Embedding before/after screenshots inline in PR descriptions with only the gh CLI — why user-attachments, gists, and release assets all failed, and why we don't prune the PNGs",
    color: "#fb923c",
  },
  {
    title: "Tiered Testing Strategy",
    href: "/thoughts/test-tiers",
    preview:
      "Why you shouldn't run every test on every commit: split by cost — fast unit tests per push, integration on merge, e2e nightly, flaky ones quarantined",
    color: "#818cf8",
  },
  {
    title: "Operator Dashboard",
    href: "/thoughts/operator-dashboard",
    preview:
      "Fleet management with tiered polling, optimistic updates, data freshness, and a globalThis singleton for in-memory state",
    color: "#8b5cf6",
  },
  {
    title: "Render Performance",
    href: "/thoughts/render-perf",
    preview:
      "Runtime rendering costs: context instability, resize allocation, backdrop-filter GPU pressure, and unbounded DOM growth",
    color: "#14b8a6",
  },
  {
    title: "V2 Redesign",
    href: "/thoughts/v2-redesign",
    preview:
      "URL-based version routing with next/dynamic bundle splitting — Three.js out of the default path, v2 ships a clean slate",
    color: "#e879f9",
  },
  {
    title: "V3 Redesign",
    href: "/thoughts/v3-redesign",
    preview:
      "The whole site as a node graph — a hand-rolled force sim, fit-to-viewport rendering, the drag/hover bugs, and an a11y audit",
    color: "#8b5cf6",
  },
  {
    title: "V4 Redesign",
    href: "/thoughts/v4-redesign",
    preview:
      "The landing and hub as a slot machine: three dependent reels (category, option, write-up) derived from the same data as the graph, dependent-reel selection, a decelerating spin, and a listbox-based a11y model",
    color: "#f472b6",
  },
  {
    title: "Project Review",
    href: "/thoughts/project-review",
    preview:
      "An evidence-backed review of the whole codebase — engineering, system design, architecture overfit, and per-feature UX gains",
    color: "#64748b",
  },
  {
    title: "Refactor Pass",
    href: "/thoughts/refactor-pass",
    preview:
      "The maintainability roadmap after the review — deduping against existing abstractions, the overfits I avoid, and the order I ship in",
    color: "#14b8a6",
  },
  {
    title: "AI Security & Bare Repo Attacks",
    href: "/thoughts/ai-security",
    preview:
      "Prompt injection via CLAUDE.md, hardened least-privilege configs, deny lists, and sandboxed environments for untrusted code",
    color: "#dc2626",
  },
  {
    title: "AI Agent Patterns",
    href: "/thoughts/ai-agent-patterns",
    preview:
      "SSE streaming, state machines, tool call UI, approval gates, and streaming markdown — the patterns behind modern agent interfaces",
    color: "#6366f1",
  },
  {
    title: "macOS Menu Bar",
    href: "/thoughts/mac-menu-bar",
    preview:
      "Turning a desktop clone's dead top-bar labels into a signal-driven macOS menu system — menus derived from window and dock state, real actions, and full keyboard a11y",
    color: "#0a84ff",
  },
  {
    title: "Hybrid Rendering",
    href: "/thoughts/hybrid-rendering",
    preview:
      "Giving each Angular route the render mode it needs — the Thoughts pages prerender to static HTML at build time via per-route RenderMode, a SeoService writes the head and JSON-LD on the server, and the interactive shell stays client-rendered",
    color: "#dd0031",
  },
  {
    title: "Shared Design System",
    href: "/thoughts/design-system",
    preview:
      "Extracting tokens and components into @paul-portfolio npm packages — CSS custom properties, thin framework wrappers, and token aliasing across React and Angular apps",
    color: "#06b6d4",
  },
  {
    title: "Framework-Agnostic Charts",
    href: "/thoughts/design-system-charts",
    preview:
      "Rebuilding recharts and unovis charts as pure SVG from one dependency-free geometry core — Sparkline, BarChart, DonutChart rendering identically in React and Angular, with a token palette and role=img a11y",
    color: "#8b5cf6",
  },
  {
    title: "Accessibility",
    href: "/thoughts/accessibility",
    preview:
      "WCAG 2.1 AA compliance — vitest-axe for unit-level scans, systematic primitive audits, and where automated tooling helps vs. where it doesn't",
    color: "#f59e0b",
  },
  {
    title: "E2E Testing",
    href: "/thoughts/e2e",
    preview:
      "Auth0 Universal Login, global setup/teardown, the Google OAuth button hijack, and what broke when we actually ran them",
    color: "#f43f5e",
  },
  {
    title: "npm to pnpm",
    href: "/thoughts/npm-to-pnpm",
    preview:
      "Strict dependency resolution, version range surprises, and what a package manager migration actually involves",
    color: "#f59e0b",
  },
  {
    title: "API Backend Overhaul",
    href: "/thoughts/api-backend-overhaul",
    preview:
      "Rebuilding portfolio_api into a typed, layered TypeScript backend across twelve phases, without breaking a single contract paul-explore depends on",
    color: "#0ea5e9",
  },
  {
    title: "Deployment",
    href: "/thoughts/deployment",
    preview:
      "Deployment as five separate jobs, choosing a platform from the app's runtime shape, when to decide, the trade-offs that bite, and the Vercel + Cloudflare setup behind this site",
    color: "#0ea5e9",
  },
  {
    title: "Bundlers",
    href: "/thoughts/bundlers",
    preview:
      "Which bundler this project runs and why, whether it's the right one, and the real situations where a lead reaches for a different bundler — the deliverable and the dominant constraint pick it, not taste",
    color: "#a855f7",
  },
  {
    title: "Tree Shaking",
    href: "/thoughts/tree-shaking",
    preview:
      "The three kinds of dead weight, why removing an unused export isn't a bundle win, the judgment calls a depcheck report can't make, and wiring it all into CI as a blocking check",
    color: "#22c55e",
  },
  {
    title: "Tree Shaking, Round 2",
    href: "/thoughts/tree-shaking-2",
    preview:
      "A second pass from green dead-code checks: tree-shaking the barrels Next doesn't optimize by default for a measured 148KB, then a real LCP fix — moving the entrance reveal off the JS bundle and lazy-loading the operator charts",
    color: "#16a34a",
  },
  {
    title: "Work Portfolio",
    href: "/thoughts/work-portfolio",
    preview:
      "Rebuilding 24 features from 11 old jobs as self-contained demos: reconstruction over emulation, anonymizing client work, the no-new-deps rule, the dual-ticker UX, and shipping it as merge-order-independent PRs",
    color: "#60a5fa",
  },
  {
    title: "Motion Components",
    href: "/thoughts/motion-components",
    preview:
      "TiltCard, GradientBackground, and Spotlight for the shared design system — pointer-driven motion built static-first, with reduced motion as the default and one shared usePrefersReducedMotion hook",
    color: "#a78bfa",
  },
  {
    title: "Design System Showcase",
    href: "/thoughts/design-system-showcase",
    preview:
      "Building a live, in-app gallery for the shared design system: dogfooding the primitives, a data-driven catalog with an integrity test, an interactive props playground, and an axe-checked accessibility contract",
    color: "#06b6d4",
  },
  {
    title: "Craft",
    href: "/thoughts/craft",
    preview:
      "A page that reframes the whole site as evidence: ten lead front-end traits, each expandable to the real work that proves it, with a data-integrity test that fails on a dead evidence link",
    color: "#c084fc",
  },
  {
    title: "Command Palette",
    href: "/thoughts/command-palette",
    preview:
      "The site-wide ⌘K palette: one globally mounted instance opened from a hotkey or a window event, a registry reused from the hub's FEATURES and THOUGHTS, a hand-rolled fuzzy matcher, and an honest ARIA combobox",
    color: "#818cf8",
  },
  {
    title: "Feature Flags",
    href: "/thoughts/feature-flags",
    preview:
      "A flag console built engine-first: deterministic FNV-1a bucketing with an avalanche step, sticky and monotonic rollouts, first-match targeting, an explainable evaluation reason, and why the pure core is the whole design",
    color: "#fb923c",
  },
  {
    title: "Gallery Wall",
    href: "/thoughts/gallery-wall",
    preview:
      "An arranger built pure-core-first: standard frame sizes, an aspect-matching auto-framer with a medium tie-break, a centered shelf-packing layout with overflow detection, and an inches-internal model with a cm toggle at the input edge",
    color: "#e879f9",
  },
  {
    title: "Explore Toronto",
    href: "/thoughts/world",
    preview:
      "A walkable 3D Toronto built from primitives: a TDD'd pure movement core, an R3F shell around it, a seeded procedural skyline over a real street grid, and exhibits that deep-link every feature",
    color: "#38bdf8",
  },
  {
    title: "Crawlers",
    href: "/thoughts/crawlers",
    preview:
      "The five files a site is supposed to serve and this one didn't: what to leave out of robots.txt, why the sitemap carries no lastModified, and the test that stops it going stale",
    color: "#34d399",
  },
  {
    title: "Visual Plans",
    href: "/thoughts/harness-visual-plan",
    preview:
      "Why I bracket every change with a visual plan before code and a recap after: structured wireframes over prose, the RED list as the plan, and an honest record of where reality drifted",
    color: "#818cf8",
  },
].reverse();

// ---------------------------------------------------------------------------
// Mini preview sub-components
// ---------------------------------------------------------------------------
// Static mockups that look like mini screenshots. In light mode they use a
// light gray background with dark ink; in dark mode they flip to a near-black
// background with white ink — same pattern as the landing page sections, just
// theme-aware this time.

export const PLAYOFF_ROWS = [
  { conf: "E", s1: 1, t1: "BOS", s2: 8, t2: "MIA", pick: 1 },
  { conf: "W", s1: 1, t1: "OKC", s2: 8, t2: "MEM", pick: 1 },
  { conf: "E", s1: 2, t1: "CLE", s2: 7, t2: "ORL", pick: 2 },
  { conf: "W", s1: 2, t1: "GSW", s2: 7, t2: "LAL", pick: 2 },
];

export const TCG_CARDS = [
  { name: "Charizard", gradient: "from-orange-500 to-red-600" },
  { name: "Pikachu", gradient: "from-yellow-400 to-amber-500" },
  { name: "Mewtwo", gradient: "from-purple-500 to-violet-700" },
  { name: "Blastoise", gradient: "from-blue-500 to-cyan-600" },
  { name: "Gengar", gradient: "from-purple-700 to-indigo-800" },
  { name: "Eevee", gradient: "from-amber-400 to-orange-400" },
];

export const POCKET_EXPANSIONS = [
  { name: "Genetic Apex", gradient: "from-indigo-500 to-violet-700" },
  { name: "Mythical Island", gradient: "from-teal-500 to-cyan-700" },
  { name: "Space-Time Smackdown", gradient: "from-blue-600 to-indigo-700" },
];
