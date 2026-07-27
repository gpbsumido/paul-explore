"use client";

import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";
import { reveal } from "@/app/landing/Section";
import { spring, cardFlipIn, instantTransition } from "@/lib/animations";
import type { FeatureItem, ThoughtItem } from "@/types/hub";

// ---------------------------------------------------------------------------
// Feature & thought data
// ---------------------------------------------------------------------------

// Ordered most-impressive first — this order drives the flat Apps column, the
// graph's feature cluster, and the signed-in hub grid.
export const FEATURES: FeatureItem[] = [
  {
    id: "operator",
    title: "Operator Dashboard",
    description:
      "Manage a MicroMart smart store fleet — live status, alerts, inventory health, analytics charts, and per-store drill-down.",
    href: "/operator",
    color: "#8b5cf6",
    thoughtsHref: "/thoughts/operator-dashboard",
  },
  {
    id: "work-portfolio",
    title: "Work Portfolio",
    description:
      "Interactive reconstructions of features shipped on past products: dashboards, marketing tooling, onboarding flows, and more, browsable through dual tickers.",
    href: "/work-portfolio",
    color: "#60a5fa",
  },
  {
    id: "learn",
    title: "Learn",
    description:
      "Interactive deep-dives into algorithms and frontend patterns. Build real intuition, not memorized templates.",
    href: "/learn",
    color: "#34d399",
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
    id: "graphql",
    title: "GraphQL Pokédex",
    description:
      "Pokémon browser on the PokeAPI Hasura endpoint. Plain fetch over Apollo, typed queries, streaming SSR, and a live query inspector.",
    href: "/graphql",
    color: "#14b8a6",
    thoughtsHref: "/thoughts/graphql",
  },
  {
    id: "tcg",
    title: "Pokémon TCG",
    description:
      "Card browser with infinite scroll, URL-synced filters, per-set grids, and deep card detail pages — built on the TCGdex SDK.",
    href: "/tcg/pokemon",
    color: "#ef4444",
    thoughtsHref: "/thoughts/tcg",
  },
  {
    id: "pocket",
    title: "TCG Pocket",
    description:
      "All Pokémon TCG Pocket expansions — sets, packs, and individual card pages with full metadata and ISR caching.",
    href: "/tcg/pocket",
    color: "#6366f1",
  },
];

export const THOUGHTS: ThoughtItem[] = [
  {
    title: "Feature Flags",
    href: "/thoughts/feature-flags",
    preview:
      "A flag console built engine-first: deterministic FNV-1a bucketing with an avalanche step, sticky and monotonic rollouts, first-match targeting, an explainable evaluation reason, and why the pure core is the whole design",
    color: "#fb923c",
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
    title: "Shared Design System",
    href: "/thoughts/design-system",
    preview:
      "Extracting tokens and components into @paul-portfolio npm packages — CSS custom properties, thin framework wrappers, and token aliasing across React and Angular apps",
    color: "#06b6d4",
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
  },{
    title: "Tree Shaking",
    href: "/thoughts/tree-shaking",
    preview:
      "The three kinds of dead weight, why removing an unused export isn't a bundle win, the judgment calls a depcheck report can't make, and wiring it all into CI as a blocking check",
    color: "#22c55e",
  },
  {
    title: "Work Portfolio",
    href: "/thoughts/work-portfolio",
    preview:
      "Rebuilding 24 features from 11 old jobs as self-contained demos: reconstruction over emulation, anonymizing client work, the no-new-deps rule, the dual-ticker UX, and shipping it as merge-order-independent PRs",
    color: "#60a5fa",
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

export function PlayoffsPreview() {
  return (
    <div className="space-y-1">
      {PLAYOFF_ROWS.map((m, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2 py-1"
        >
          <span className="w-3 shrink-0 text-[7px] font-bold text-black/25 dark:text-white/25">
            {m.conf}
          </span>
          <span
            className={[
              "flex-1 text-[8px] font-semibold",
              m.pick === 1
                ? "text-[#f43f5e]"
                : "text-black/35 dark:text-white/35",
            ].join(" ")}
          >
            {m.s1} {m.t1}
          </span>
          <span className="text-[7px] text-black/20 dark:text-white/20">
            vs
          </span>
          <span
            className={[
              "flex-1 text-right text-[8px] font-semibold",
              m.pick === 2
                ? "text-[#f43f5e]"
                : "text-black/35 dark:text-white/35",
            ].join(" ")}
          >
            {m.t2} {m.s2}
          </span>
        </div>
      ))}
    </div>
  );
}

// Same gradient data the landing page TcgSection uses.
export const TCG_CARDS = [
  { name: "Charizard", gradient: "from-orange-500 to-red-600" },
  { name: "Pikachu", gradient: "from-yellow-400 to-amber-500" },
  { name: "Mewtwo", gradient: "from-purple-500 to-violet-700" },
  { name: "Blastoise", gradient: "from-blue-500 to-cyan-600" },
  { name: "Gengar", gradient: "from-purple-700 to-indigo-800" },
  { name: "Eevee", gradient: "from-amber-400 to-orange-400" },
];

export function TcgPreview() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {TCG_CARDS.map((card) => (
        <div
          key={card.name}
          className={`rounded-md border border-black/10 dark:border-white/10 bg-gradient-to-br ${card.gradient}`}
          style={{ aspectRatio: "2.5/3.5" }}
        />
      ))}
    </div>
  );
}

export const POCKET_EXPANSIONS = [
  { name: "Genetic Apex", gradient: "from-indigo-500 to-violet-700" },
  { name: "Mythical Island", gradient: "from-teal-500 to-cyan-700" },
  { name: "Space-Time Smackdown", gradient: "from-blue-600 to-indigo-700" },
];

export function PocketPreview() {
  return (
    <div className="space-y-1.5">
      {POCKET_EXPANSIONS.map((exp) => (
        <div
          key={exp.name}
          className={`flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-gradient-to-r ${exp.gradient} px-2.5 py-2`}
        >
          <div className="h-5 w-5 shrink-0 rounded-sm bg-white/20" />
          <span className="truncate text-[9px] font-semibold text-white/80">
            {exp.name}
          </span>
        </div>
      ))}
    </div>
  );
}

// February 2026 — matches the CalendarSection on the landing page.
export const CAL_DOW = ["S", "M", "T", "W", "T", "F", "S"] as const;

type CalDay = { d: number; faded?: boolean; today?: boolean; chip?: string };

export const CAL_DAYS: CalDay[] = [
  { d: 26, faded: true },
  { d: 27, faded: true },
  { d: 28, faded: true },
  { d: 1, chip: "#10b981" },
  { d: 2 },
  { d: 3 },
  { d: 4 },
  { d: 5 },
  { d: 6, chip: "#3b82f6" },
  { d: 7, chip: "#8b5cf6" },
  { d: 8, chip: "#3b82f6" },
  { d: 9 },
  { d: 10 },
  { d: 11, today: true },
];

export function CalendarPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
      <div className="grid grid-cols-7 border-b border-black/10 dark:border-white/10">
        {CAL_DOW.map((d, i) => (
          <div
            key={i}
            className="py-0.5 text-center text-[7px] font-bold uppercase tracking-wider text-black/30 dark:text-white/30"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {CAL_DAYS.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-px py-0.5">
            <span
              className={[
                "inline-flex h-[14px] w-[14px] items-center justify-center rounded-full text-[8px]",
                day.today
                  ? "bg-red-500 font-semibold text-white"
                  : day.faded
                    ? "text-black/20 dark:text-white/20"
                    : "text-black/60 dark:text-white/60",
              ].join(" ")}
            >
              {day.d}
            </span>
            {day.chip && (
              <div
                className="h-[3px] w-[10px] rounded-full"
                style={{ backgroundColor: day.chip }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const GRAPHQL_POKEMON = [
  {
    name: "Pikachu",
    types: ["Electric"],
    gradient: "from-yellow-400 to-amber-500",
  },
  {
    name: "Charizard",
    types: ["Fire", "Flying"],
    gradient: "from-orange-500 to-red-600",
  },
  {
    name: "Mewtwo",
    types: ["Psychic"],
    gradient: "from-purple-500 to-violet-700",
  },
];

export function GraphQLPreview() {
  return (
    <div className="space-y-1.5">
      {GRAPHQL_POKEMON.map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-2"
        >
          <div
            className={`h-5 w-5 shrink-0 rounded-full bg-gradient-to-br ${p.gradient}`}
          />
          <span className="flex-1 truncate text-[9px] text-black/70 dark:text-white/70">
            {p.name}
          </span>
          <div className="flex shrink-0 gap-1">
            {p.types.map((t) => (
              <span
                key={t}
                className="rounded bg-black/10 dark:bg-white/10 px-1 py-px text-[7px] text-black/50 dark:text-white/50"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Mock data for the vitals preview — values chosen to look like a healthy site.
export const VITALS_MOCK = [
  { name: "LCP", value: "1.8s", rating: "good", pct: 55 },
  { name: "FCP", value: "1.2s", rating: "good", pct: 35 },
  { name: "INP", value: "84ms", rating: "good", pct: 25 },
  { name: "CLS", value: "0.04", rating: "good", pct: 16 },
  { name: "TTFB", value: "620ms", rating: "needs-improvement", pct: 65 },
] as const;

export const VITALS_DOT_COLORS = {
  good: "#22c55e",
  "needs-improvement": "#f59e0b",
  poor: "#ef4444",
} as const;

export function VitalsPreview() {
  return (
    <div className="space-y-1.5">
      {VITALS_MOCK.map((m) => (
        <div
          key={m.name}
          className="flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-1.5"
        >
          <div
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: VITALS_DOT_COLORS[m.rating] }}
          />
          <span className="w-9 shrink-0 text-[9px] font-bold text-black/60 dark:text-white/60">
            {m.name}
          </span>
          {/* mini progress bar — width is eyeballed to look plausible, not mathematically derived */}
          <div
            className="flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
            style={{ height: 3 }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${m.pct}%`,
                backgroundColor: VITALS_DOT_COLORS[m.rating],
              }}
            />
          </div>
          <span className="shrink-0 tabular-nums text-[9px] text-black/50 dark:text-white/50">
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Static particle network mockup — a handful of dots connected by faint lines.
export const PARTICLE_DOTS = [
  { x: 18, y: 28, r: 3, color: "#6366f1" },
  { x: 52, y: 15, r: 2, color: "#3b82f6" },
  { x: 80, y: 35, r: 3, color: "#8b5cf6" },
  { x: 35, y: 65, r: 2, color: "#06b6d4" },
  { x: 68, y: 72, r: 3, color: "#6366f1" },
  { x: 90, y: 55, r: 2, color: "#8b5cf6" },
  { x: 10, y: 60, r: 2, color: "#3b82f6" },
];
export const PARTICLE_LINES = [
  [0, 1],
  [1, 2],
  [2, 5],
  [0, 3],
  [3, 4],
  [4, 5],
  [1, 4],
  [3, 6],
] as const;

export function ParticlesPreview() {
  return (
    <svg viewBox="0 0 100 90" className="h-full w-full" aria-hidden>
      {PARTICLE_LINES.map(([a, b], i) => (
        <line
          key={i}
          x1={PARTICLE_DOTS[a].x}
          y1={PARTICLE_DOTS[a].y}
          x2={PARTICLE_DOTS[b].x}
          y2={PARTICLE_DOTS[b].y}
          stroke={PARTICLE_DOTS[a].color}
          strokeWidth="0.6"
          strokeOpacity="0.4"
        />
      ))}
      {PARTICLE_DOTS.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={d.color}
          fillOpacity="0.85"
        />
      ))}
    </svg>
  );
}

export const KETSUP_FEED = [
  {
    user: "paulsum",
    avatar: "#f9a8d4",
    hasImage: true,
    gradient: "from-orange-400 to-pink-500",
  },
  { user: "janedoe", avatar: "#a5f3fc", hasImage: false, gradient: "" },
  {
    user: "markr",
    avatar: "#d9f99d",
    hasImage: true,
    gradient: "from-green-400 to-teal-500",
  },
];

export function KetsupPreview() {
  return (
    <div className="space-y-1.5">
      {KETSUP_FEED.map((post) => (
        <div
          key={post.user}
          className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2 py-1.5"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: post.avatar }}
            />
            <span className="text-[8px] font-semibold text-black/60 dark:text-white/60">
              {post.user}
            </span>
          </div>
          {post.hasImage && (
            <div
              className={`mb-1 h-5 w-full rounded bg-gradient-to-r ${post.gradient} opacity-70`}
            />
          )}
          <div className="h-1.5 w-3/4 rounded-full bg-black/10 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export const OPERATOR_STORES = [
  { name: "Lobby Fridge", status: "online" as const, health: 82 },
  { name: "Break Room", status: "degraded" as const, health: 45 },
  { name: "Cafeteria", status: "online" as const, health: 91 },
];

export const STATUS_DOT: Record<string, string> = {
  online: "#22c55e",
  degraded: "#f59e0b",
  offline: "#ef4444",
};

export function OperatorPreview() {
  return (
    <div className="space-y-1.5">
      {OPERATOR_STORES.map((s) => (
        <div
          key={s.name}
          className="flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-1.5"
        >
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: STATUS_DOT[s.status] }}
          />
          <span className="flex-1 truncate text-[9px] text-black/70 dark:text-white/70">
            {s.name}
          </span>
          <div className="h-1.5 w-8 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${s.health}%`,
                backgroundColor: s.health > 60 ? "#22c55e" : "#f59e0b",
              }}
            />
          </div>
          <span className="shrink-0 tabular-nums text-[8px] text-black/40 dark:text-white/40">
            {s.health}%
          </span>
        </div>
      ))}
    </div>
  );
}

export const LEARN_PREVIEW_ITEMS = [
  { num: "01", title: "Two Pointers" },
  { num: "05", title: "Binary Search" },
  { num: "08", title: "Dynamic Programming" },
  { num: "10", title: "Memoization" },
  { num: "13", title: "From Scratch" },
];

export function LearnPreview() {
  return (
    <div className="relative overflow-hidden h-full">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(currentColor 0.5px, transparent 0.5px)",
          backgroundSize: "10px 10px",
        }}
      />
      <div className="relative space-y-1.5 py-0.5">
        {LEARN_PREVIEW_ITEMS.map((item) => (
          <div key={item.num} className="flex items-baseline gap-2 px-1">
            <span className="font-mono text-[7px] tabular-nums text-black/20 dark:text-white/20">
              {item.num}
            </span>
            <span className="text-[9px] text-black/50 dark:text-white/50">
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// The work-portfolio card gets an animated mini dual-ticker so it stands out:
// two rows of accent-dotted chips marquee in opposite directions, mirroring the
// real feature. Falls back to a static strip under prefers-reduced-m.
const WP_TOP = ["Content Engine", "Analytics Suite", "Portal v2", "Gamer Hub"];
const WP_BOTTOM = ["Wallet Lookup", "LLM Assistant", "Dashboard", "Email Studio"];

function WpTickerRow({
  items,
  direction,
  reduced,
}: {
  items: readonly string[];
  direction: "left" | "right";
  reduced: boolean;
}) {
  // two copies so the marquee loops seamlessly, same trick as the real ticker
  const doubled = [...items, ...items];
  const keyframes = direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"];
  return (
    <div className="flex overflow-hidden">
      <m.div
        className="flex w-max shrink-0 gap-1.5"
        animate={reduced ? undefined : { x: keyframes }}
        transition={
          reduced
            ? undefined
            : { duration: 14, ease: "linear", repeat: Infinity }
        }
      >
        {doubled.map((label, i) => (
          <span
            key={i}
            className="flex items-center gap-1 rounded-full border border-black/10 px-1.5 py-0.5 dark:border-white/10"
            style={{
              background:
                "color-mix(in srgb, var(--color-feature-work-portfolio) 12%, transparent)",
            }}
          >
            <span
              aria-hidden
              className="h-1 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: "#60a5fa" }}
            />
            <span className="whitespace-nowrap text-[7px] text-black/50 dark:text-white/50">
              {label}
            </span>
          </span>
        ))}
      </m.div>
    </div>
  );
}

export function WorkPortfolioPreview() {
  const reduced = useReducedMotion();
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <WpTickerRow items={WP_TOP} direction="left" reduced={!!reduced} />
      <WpTickerRow items={WP_BOTTOM} direction="right" reduced={!!reduced} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Maps & tokens
// ---------------------------------------------------------------------------

// Maps feature.id to its design-token CSS variable name.
export const FEATURE_TOKEN: Record<string, string> = {
  "fantasy-nba": "--color-feature-nba",
  tcg: "--color-feature-tcg",
  pocket: "--color-feature-particles",
  calendar: "--color-feature-calendar",
  graphql: "--color-feature-graphql",
  vitals: "--color-feature-vitals",
  particles: "--color-feature-particles",
  ketsup: "--color-feature-ketsup",
  operator: "--color-feature-operator",
  learn: "--color-feature-learn",
  "work-portfolio": "--color-feature-work-portfolio",
};

// Keyed by feature.id so FeatureCard can look up the right preview without a switch.
export const PREVIEW_MAP: Record<string, React.ComponentType> = {
  "fantasy-nba": PlayoffsPreview,
  tcg: TcgPreview,
  pocket: PocketPreview,
  calendar: CalendarPreview,
  graphql: GraphQLPreview,
  vitals: VitalsPreview,
  particles: ParticlesPreview,
  ketsup: KetsupPreview,
  operator: OperatorPreview,
  learn: LearnPreview,
  "work-portfolio": WorkPortfolioPreview,
};

// ---------------------------------------------------------------------------
// FeatureCard
// ---------------------------------------------------------------------------

interface FeatureCardProps {
  feature: FeatureItem;
  prefersReduced: boolean;
}

/**
 * A single feature card. The top half is a themed preview area that reads like
 * a mini screenshot of the feature. The card uses a glass treatment tinted with
 * the feature's pastel design token.
 *
 * Entrance is driven by the parent staggerContainer variant; this component
 * only declares `variants={cardFlipIn}` and lets Framer inherit initial/animate.
 */
export function FeatureCard({ feature, prefersReduced }: FeatureCardProps) {
  const Preview = PREVIEW_MAP[feature.id];
  const token = FEATURE_TOKEN[feature.id] ?? "--color-feature-nba";

  return (
    <m.div
      variants={cardFlipIn}
      transition={prefersReduced ? instantTransition : { ...spring.smooth }}
      whileHover={{ y: -4, transition: { ...spring.snappy } }}
      className="flex flex-col overflow-hidden rounded-2xl h-full"
      style={{
        background: `color-mix(in srgb, var(${token}) 6%, rgba(255,255,255,0.04))`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid color-mix(in srgb, var(${token}) 15%, rgba(255,255,255,0.08))`,
      }}
    >
      <div
        className="overflow-hidden"
        style={{
          height: 112,
          background: `color-mix(in srgb, var(${token}) 8%, transparent)`,
        }}
      >
        <div className="p-3">{Preview && <Preview />}</div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-2">
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: feature.color }}
          />
          <h3 className="text-[15px] font-semibold leading-snug text-foreground">
            {feature.title}
          </h3>
        </div>

        <p className="flex-1 text-[13px] leading-relaxed text-muted">
          {feature.description}
        </p>

        {/* About on the left, Open on the right */}
        <div className="mt-3 flex items-center justify-between">
          {feature.thoughtsHref ? (
            <Link
              href={feature.thoughtsHref}
              className="text-[13px] text-muted transition-colors hover:text-foreground"
            >
              About
            </Link>
          ) : (
            <div />
          )}
          {feature.href.startsWith("http") ? (
            <a
              href={feature.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-semibold transition-opacity hover:opacity-75"
              style={{ color: feature.color }}
            >
              Open →
            </a>
          ) : (
            <Link
              href={feature.href}
              className="text-[13px] font-semibold transition-opacity hover:opacity-75"
              style={{ color: feature.color }}
            >
              Open →
            </Link>
          )}
        </div>
      </div>
    </m.div>
  );
}

// ---------------------------------------------------------------------------
// ThoughtCard
// ---------------------------------------------------------------------------

interface ThoughtCardProps {
  thought: ThoughtItem;
  delayMs: number;
  visible: boolean;
}

/** Compact link card for the dev-notes section. */
export function ThoughtCard({ thought, delayMs, visible }: ThoughtCardProps) {
  // h-full on the Link fills the grid item's height so all cards in a row
  // stay the same height even when preview text wraps to multiple lines.
  // The grid handles row equalization via align-items: stretch (default).
  return (
    <div
      className={`min-w-0 ${reveal(visible)}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <Link
        href={thought.href}
        className="flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-3 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm"
        style={{ borderLeft: `2px solid ${thought.color}` }}
      >
        <div
          className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: thought.color }}
        />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-snug text-foreground">
            {thought.title}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">{thought.preview}</p>
        </div>
      </Link>
    </div>
  );
}
