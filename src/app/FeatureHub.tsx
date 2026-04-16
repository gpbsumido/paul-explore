"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { reveal } from "@/app/landing/Section";
import { queryKeys } from "@/lib/queryKeys";
import {
  spring,
  staggerContainer,
  cardFlipIn,
  instantTransition,
} from "@/lib/animations";
import { useHubReducedMotion } from "@/app/providers";
import type { FeatureItem, ThoughtItem } from "@/types/hub";

// These are strictly UI data so they live here, not in a separate config file.
const FEATURES: FeatureItem[] = [
  {
    id: "nba",
    title: "NBA Stats",
    description:
      "Live player stats via API proxy. Batch loading, per-player error states, and skeleton rows while the NBA API catches up.",
    href: "/fantasy/nba/player/stats",
    color: "#007aff",
  },
  {
    id: "matchups",
    title: "Fantasy Matchups",
    description:
      "Head-to-head weekly matchups with category breakdowns, animated win bars, and an AI-style prediction panel with start/sit recommendations.",
    href: "/fantasy/nba/matchups",
    color: "#FF6B35",
  },
  {
    id: "court-vision",
    title: "Court Vision",
    description:
      "SVG half-court shot chart with color-coded shooting zones. Hover for per-zone FG% and attempts per game.",
    href: "/fantasy/nba/court-vision",
    color: "#00D4FF",
  },
  {
    id: "league",
    title: "League History",
    description:
      "ESPN fantasy basketball standings by season. Glassmorphism team cards, expandable rosters, and a season selector.",
    href: "/fantasy/nba/league-history",
    color: "#ff9500",
  },
  {
    id: "playoffs",
    title: "NBA Playoffs Bracket",
    description:
      "Pick every series winner, length, and MVP before the playoffs start. Debounced auto-save, cascade clears, TBD resolution, and a public leaderboard with per-round scoring.",
    href: "/fantasy/nba/playoffs",
    color: "#f43f5e",
    thoughtsHref: "/thoughts/playoffs",
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
    id: "graphql",
    title: "GraphQL Pokédex",
    description:
      "Pokémon browser on the PokeAPI Hasura endpoint. Plain fetch over Apollo, typed queries, streaming SSR, and a live query inspector.",
    href: "/graphql",
    color: "#14b8a6",
    thoughtsHref: "/thoughts/graphql",
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
].reverse();

const THOUGHTS: ThoughtItem[] = [
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
    title: "GraphQL",
    href: "/thoughts/graphql",
    preview: "Why GraphQL, why plain fetch over Apollo",
    color: "#6366f1",
  },
  {
    title: "Web Vitals",
    href: "/thoughts/vitals",
    preview: "Real-user metrics, sendBeacon, P75, and the collection pipeline",
    color: "#22c55e",
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
      "108 tests, Vitest + MSW, and the delay() trick for proving optimistic updates fire before the server responds",
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
    title: "CI E2E Reliability",
    href: "/thoughts/ci-e2e",
    preview:
      "Auth0 crashing all middleware from a module-level throw, and a search test that needed page.route to stop depending on an external API",
    color: "#06b6d4",
  },
].reverse();

// ---- Mini preview sub-components ----
// Static mockups that look like mini screenshots. In light mode they use a
// light gray background with dark ink; in dark mode they flip to a near-black
// background with white ink — same pattern as the landing page sections, just
// theme-aware this time.

const NBA_PLAYERS = [
  { name: "LeBron James", pts: 25.6, reb: 7.3, ast: 8.1 },
  { name: "Anthony Davis", pts: 22.4, reb: 11.2, ast: 3.2 },
  { name: "Austin Reaves", pts: 16.8, reb: 3.2, ast: 4.1 },
];

function NBAPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
      <div className="grid grid-cols-[1fr_2.5rem_2.5rem_2.5rem] border-b border-black/10 dark:border-white/10 px-2 py-1">
        {["Player", "PTS", "REB", "AST"].map((h) => (
          <span
            key={h}
            className="text-[7px] font-bold uppercase tracking-wider text-black/30 dark:text-white/30 last:text-right [&:not(:first-child)]:text-right"
          >
            {h}
          </span>
        ))}
      </div>
      {NBA_PLAYERS.map((p) => (
        <div
          key={p.name}
          className="grid grid-cols-[1fr_2.5rem_2.5rem_2.5rem] items-center border-b border-black/5 dark:border-white/5 px-2 py-1.5 last:border-b-0"
        >
          <span className="truncate text-[9px] text-black/70 dark:text-white/70">
            {p.name}
          </span>
          <span className="text-right tabular-nums text-[9px] text-black/50 dark:text-white/50">
            {p.pts}
          </span>
          <span className="text-right tabular-nums text-[9px] text-black/50 dark:text-white/50">
            {p.reb}
          </span>
          <span className="text-right tabular-nums text-[9px] text-black/50 dark:text-white/50">
            {p.ast}
          </span>
        </div>
      ))}
    </div>
  );
}

const MATCHUP_DATA = [
  { away: "Wemby's Team", home: "Stroke Bros", awayPts: 342, homePts: 318 },
  { away: "Running Shoe", home: "LaMelo Arc", awayPts: 287, homePts: 301 },
];

function MatchupsPreview() {
  return (
    <div className="space-y-1.5">
      {MATCHUP_DATA.map((m) => {
        const total = m.awayPts + m.homePts || 1;
        const leftPct = (m.awayPts / total) * 100;
        return (
          <div
            key={m.away}
            className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-2 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-[8px] text-black/60 dark:text-white/60">
                {m.away}
              </span>
              <span className="tabular-nums text-[9px] font-bold text-[#FF6B35]">
                {m.awayPts}
              </span>
            </div>
            <div className="flex h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="rounded-l-full bg-[#FF6B35]"
                style={{ width: `${leftPct}%` }}
              />
              <div
                className="rounded-r-full bg-[#00D4FF]"
                style={{ width: `${100 - leftPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="truncate text-[8px] text-black/60 dark:text-white/60">
                {m.home}
              </span>
              <span className="tabular-nums text-[9px] font-bold text-[#00D4FF]">
                {m.homePts}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const COURT_ZONES = [
  { zone: "Paint", pct: 58.2, color: "#ef4444" },
  { zone: "Mid-Range", pct: 42.1, color: "#eab308" },
  { zone: "Corner 3", pct: 37.5, color: "#3b82f6" },
  { zone: "Above Break", pct: 35.8, color: "#3b82f6" },
];

function CourtVisionPreview() {
  return (
    <div className="space-y-1">
      {COURT_ZONES.map((z) => (
        <div
          key={z.zone}
          className="flex items-center gap-2 rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2 py-1"
        >
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: z.color }}
          />
          <span className="flex-1 text-[8px] text-black/60 dark:text-white/60">
            {z.zone}
          </span>
          <span className="tabular-nums text-[9px] font-bold text-black/70 dark:text-white/70">
            {z.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}

const LEAGUE_TEAMS = [
  { rank: 1, name: "The Ballers", record: "12-2" },
  { rank: 2, name: "Bench Warmers", record: "10-4" },
  { rank: 3, name: "Laker Fans Only", record: "8-6" },
];

function LeaguePreview() {
  return (
    <div className="space-y-1.5">
      {LEAGUE_TEAMS.map((t) => (
        <div
          key={t.rank}
          className="flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-2"
        >
          <span className="w-4 shrink-0 text-[9px] font-bold text-black/30 dark:text-white/30">
            #{t.rank}
          </span>
          <span className="flex-1 truncate text-[9px] text-black/70 dark:text-white/70">
            {t.name}
          </span>
          <span className="shrink-0 tabular-nums text-[9px] text-black/40 dark:text-white/40">
            {t.record}
          </span>
        </div>
      ))}
    </div>
  );
}

// Same gradient data the landing page TcgSection uses.
const TCG_CARDS = [
  { name: "Charizard", gradient: "from-orange-500 to-red-600" },
  { name: "Pikachu", gradient: "from-yellow-400 to-amber-500" },
  { name: "Mewtwo", gradient: "from-purple-500 to-violet-700" },
  { name: "Blastoise", gradient: "from-blue-500 to-cyan-600" },
  { name: "Gengar", gradient: "from-purple-700 to-indigo-800" },
  { name: "Eevee", gradient: "from-amber-400 to-orange-400" },
];

function TcgPreview() {
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

const POCKET_EXPANSIONS = [
  { name: "Genetic Apex", gradient: "from-indigo-500 to-violet-700" },
  { name: "Mythical Island", gradient: "from-teal-500 to-cyan-700" },
  { name: "Space-Time Smackdown", gradient: "from-blue-600 to-indigo-700" },
];

function PocketPreview() {
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
const CAL_DOW = ["S", "M", "T", "W", "T", "F", "S"] as const;

type CalDay = { d: number; faded?: boolean; today?: boolean; chip?: string };

const CAL_DAYS: CalDay[] = [
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

function CalendarPreview() {
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

const GRAPHQL_POKEMON = [
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

function GraphQLPreview() {
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
const VITALS_MOCK = [
  { name: "LCP", value: "1.8s", rating: "good", pct: 55 },
  { name: "FCP", value: "1.2s", rating: "good", pct: 35 },
  { name: "INP", value: "84ms", rating: "good", pct: 25 },
  { name: "CLS", value: "0.04", rating: "good", pct: 16 },
  { name: "TTFB", value: "620ms", rating: "needs-improvement", pct: 65 },
] as const;

const VITALS_DOT_COLORS = {
  good: "#22c55e",
  "needs-improvement": "#f59e0b",
  poor: "#ef4444",
} as const;

function VitalsPreview() {
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
const PARTICLE_DOTS = [
  { x: 18, y: 28, r: 3, color: "#6366f1" },
  { x: 52, y: 15, r: 2, color: "#3b82f6" },
  { x: 80, y: 35, r: 3, color: "#8b5cf6" },
  { x: 35, y: 65, r: 2, color: "#06b6d4" },
  { x: 68, y: 72, r: 3, color: "#6366f1" },
  { x: 90, y: 55, r: 2, color: "#8b5cf6" },
  { x: 10, y: 60, r: 2, color: "#3b82f6" },
];
const PARTICLE_LINES = [
  [0, 1],
  [1, 2],
  [2, 5],
  [0, 3],
  [3, 4],
  [4, 5],
  [1, 4],
  [3, 6],
] as const;

function ParticlesPreview() {
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

const KETSUP_FEED = [
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

const PLAYOFF_ROWS = [
  { conf: "E", s1: 1, t1: "BOS", s2: 8, t2: "MIA", pick: 1 },
  { conf: "W", s1: 1, t1: "OKC", s2: 8, t2: "MEM", pick: 1 },
  { conf: "E", s1: 2, t1: "CLE", s2: 7, t2: "ORL", pick: 2 },
  { conf: "W", s1: 2, t1: "GSW", s2: 7, t2: "LAL", pick: 2 },
];

function PlayoffsPreview() {
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

function KetsupPreview() {
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

// Maps feature.id to its design-token CSS variable name.
const FEATURE_TOKEN: Record<string, string> = {
  nba: "--color-feature-nba",
  matchups: "--color-feature-sync",
  "court-vision": "--color-feature-nba",
  league: "--color-feature-sync",
  playoffs: "--color-feature-nba",
  tcg: "--color-feature-tcg",
  pocket: "--color-feature-particles",
  calendar: "--color-feature-calendar",
  graphql: "--color-feature-graphql",
  vitals: "--color-feature-vitals",
  particles: "--color-feature-particles",
  ketsup: "--color-feature-ketsup",
};

// Keyed by feature.id so FeatureCard can look up the right preview without a switch.
const PREVIEW_MAP: Record<string, React.ComponentType> = {
  nba: NBAPreview,
  matchups: MatchupsPreview,
  "court-vision": CourtVisionPreview,
  league: LeaguePreview,
  playoffs: PlayoffsPreview,
  tcg: TcgPreview,
  pocket: PocketPreview,
  calendar: CalendarPreview,
  graphql: GraphQLPreview,
  vitals: VitalsPreview,
  particles: ParticlesPreview,
  ketsup: KetsupPreview,
};

// ---- FeatureCard ----

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
function FeatureCard({ feature, prefersReduced }: FeatureCardProps) {
  const Preview = PREVIEW_MAP[feature.id];
  const token = FEATURE_TOKEN[feature.id] ?? "--color-feature-nba";

  return (
    <motion.div
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
    </motion.div>
  );
}

// ---- ThoughtCard ----

interface ThoughtCardProps {
  thought: ThoughtItem;
  delayMs: number;
  visible: boolean;
}

/** Compact link card for the dev-notes section. */
function ThoughtCard({ thought, delayMs, visible }: ThoughtCardProps) {
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

// ---- FeatureHub ----

type MeData = { name: string | null; email: string | null };

/**
 * The authenticated hub. Shows a sticky header with user info, a staggered grid
 * of feature cards each with a themed mini-preview, and a dev-notes section below.
 *
 * Feature cards animate in via Framer staggerContainer + cardFlipIn variants.
 * initialMe is seeded from the Auth0 session in page.tsx so the user name renders
 * on first paint without a client-side /api/me fetch — the query still runs in the
 * background and refreshes after 5 minutes.
 */
export default function FeatureHub({ initialMe }: { initialMe?: MeData }) {
  const prefersReduced = useHubReducedMotion();

  const meQuery = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<MeData> => fetch("/api/me").then((r) => r.json()),
    initialData: initialMe,
    staleTime: 5 * 60_000,
  });
  const userName = meQuery.isLoading ? null : (meQuery.data?.name ?? "there");
  const userEmail = meQuery.data?.email ?? undefined;

  const thoughtsRef = useRef(null);
  const thoughtsVisible = useInView(thoughtsRef, {
    once: true,
    margin: "-10% 0px",
  });

  const firstName = userName ? userName.split(" ")[0] : null;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        as="header"
        zIndex="z-30"
        left={
          <span className="text-base font-bold tracking-tight text-foreground">
            paul-explore
          </span>
        }
        right={
          /* User info — hidden on small screens where space is tight */
          <div className="hidden flex-col items-end sm:flex">
            {userName === null ? (
              <>
                <div className="h-[11px] w-[88px] rounded bg-surface animate-pulse" />
                <div className="mt-0.5 h-[10px] w-[120px] rounded bg-surface animate-pulse" />
              </>
            ) : (
              <>
                <span className="text-[12px] font-medium leading-none text-foreground">
                  {userName}
                </span>
                {userEmail && (
                  <span className="mt-0.5 text-[11px] leading-none text-muted">
                    {userEmail}
                  </span>
                )}
              </>
            )}
          </div>
        }
        showSettings
        overlay={
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(139,92,246,0.04), transparent)",
            }}
          />
        }
      />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Hey {firstName ?? "there"}, here&apos;s what&apos;s live.
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            {FEATURES.length} features — click any card to jump in, or hit About
            to read how it was built.
          </p>
        </div>

        {/* Feature grid — cards stagger in with cardFlipIn via Framer variants */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          style={{ perspective: "1000px" }}
          variants={staggerContainer(0.07)}
          initial="hidden"
          animate="visible"
        >
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              prefersReduced={prefersReduced}
            />
          ))}
        </motion.div>

        {/* Dev notes — scroll-triggered */}
        <div ref={thoughtsRef} className="mt-14">
          <h2
            className={[
              "mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted/50",
              reveal(thoughtsVisible, ""),
            ].join(" ")}
          >
            Dev notes
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {THOUGHTS.map((thought, i) => (
              <ThoughtCard
                key={thought.href}
                thought={thought}
                delayMs={i * 75}
                visible={thoughtsVisible}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
