"use client";

import { useState, useEffect, useTransition, type RefObject } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useInView } from "@/app/landing/useInView";
import { reveal } from "@/app/landing/Section";
import type { FeatureItem, ThoughtItem } from "@/types/protected";

// How long each card waits before its entrance animation kicks off.
const STAGGER_MS = 75;

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
    id: "league",
    title: "League History",
    description:
      "ESPN fantasy basketball standings by season. Glassmorphism team cards, expandable rosters, and a season selector.",
    href: "/fantasy/nba/league-history",
    color: "#ff9500",
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
    href: "/protected/vitals",
    color: "#22c55e",
    thoughtsHref: "/thoughts/vitals",
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

// Keyed by feature.id so FeatureCard can look up the right preview without a switch.
const PREVIEW_MAP: Record<string, React.ComponentType> = {
  nba: NBAPreview,
  league: LeaguePreview,
  tcg: TcgPreview,
  pocket: PocketPreview,
  calendar: CalendarPreview,
  graphql: GraphQLPreview,
  vitals: VitalsPreview,
};

// ---- FeatureCard ----

interface FeatureCardProps {
  feature: FeatureItem;
  delayMs: number;
  visible: boolean;
}

/**
 * A single feature card. The top half is a themed preview area that reads like
 * a mini screenshot of the feature (light gray in light mode, near-black in dark).
 * The bottom half has the title, description, and navigation links.
 */
function FeatureCard({ feature, delayMs, visible }: FeatureCardProps) {
  const Preview = PREVIEW_MAP[feature.id];

  // Outer div for entrance animations, inner div for hover
  // (avoid transition conflicts)
  return (
    <div className={reveal(visible)} style={{ transitionDelay: `${delayMs}ms` }}>
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface h-full transition-[border-color,box-shadow] hover:border-foreground/15 hover:shadow-md">
        <div
          className="bg-neutral-100 dark:bg-neutral-950 overflow-hidden"
          style={{ height: 112 }}
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
            <Link
              href={feature.href}
              className="text-[13px] font-semibold transition-opacity hover:opacity-75"
              style={{ color: feature.color }}
            >
              Open →
            </Link>
          </div>
        </div>
      </div>
    </div>
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
    <div className={`min-w-0 ${reveal(visible)}`} style={{ transitionDelay: `${delayMs}ms` }}>
      <Link
        href={thought.href}
        className="flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-3 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm"
      >
        <div
          className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: thought.color }}
        />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-snug text-foreground">
            {thought.title}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {thought.preview}
          </p>
        </div>
      </Link>
    </div>
  );
}

// ---- FeatureHub ----

/**
 * The protected page hub. Shows a sticky header with user info, a staggered grid
 * of feature cards each with a themed mini-preview, and a dev-notes section below.
 *
 * Feature cards animate in on page load. Dev notes animate on scroll.
 * User name/email are fetched client-side from /api/me so page.tsx can be static.
 */
export default function FeatureHub() {
  // Set visible on the first animation frame after mount so the CSS transition
  // fires rather than snapping to the final state instantly.
  // startTransition marks this as non-urgent so React handles any queued
  // clicks before re-rendering the whole card grid.
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      startTransition(() => setLoaded(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(({ name, email }: { name: string | null; email: string | null }) => {
        setUserName(name ?? "there");
        setUserEmail(email ?? undefined);
      });
  }, []);

  const [thoughtsRef, thoughtsVisible] = useInView(0.1);

  const firstName = userName ? userName.split(" ")[0] : null;

  return (
    <div className="min-h-dvh bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-base font-bold tracking-tight text-foreground">
            paul-explore
          </span>

          <div className="flex items-center gap-3">
            {/* User info — hidden on small screens where space is tight */}
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
            <ThemeToggle />
            <a
              href="/auth/logout"
              className="text-[13px] font-medium text-muted transition-colors hover:text-foreground"
            >
              Log out
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        {/* Page heading */}
        <div className={`mb-8 ${reveal(loaded, "")}`}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Hey{" "}
            {firstName === null ? (
              <span className="inline-block h-4 w-16 translate-y-0.5 rounded bg-surface animate-pulse" />
            ) : (
              firstName
            )}
            , here&apos;s what&apos;s live.
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            {FEATURES.length} features — click any card to jump in, or hit About
            to read how it was built.
          </p>
        </div>

        {/* Feature grid — cards cascade in on load */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              delayMs={i * STAGGER_MS}
              visible={loaded}
            />
          ))}
        </div>

        {/* Dev notes — scroll-triggered */}
        <div ref={thoughtsRef as RefObject<HTMLDivElement>} className="mt-14">
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
                delayMs={i * STAGGER_MS}
                visible={thoughtsVisible}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
