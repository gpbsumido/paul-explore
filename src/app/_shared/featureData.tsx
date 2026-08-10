"use client";

import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";
import { reveal } from "@/app/landing/Section";
import { spring, cardFlipIn, instantTransition } from "@/lib/animations";
import type { FeatureItem, ThoughtItem } from "@/types/hub";

// The data moved to a plain module so it can be imported without dragging
// framer-motion (and "use client") along. Re-exported here so the ~20 existing
// importers keep working; new code should import from ./featureData.data.
export {
  FEATURES,
  THOUGHTS,
  PLAYOFF_ROWS,
  TCG_CARDS,
  POCKET_EXPANSIONS,
} from "./featureData.data";
// Only what the preview components below actually render.
import { PLAYOFF_ROWS, TCG_CARDS, POCKET_EXPANSIONS } from "./featureData.data";

// ---------------------------------------------------------------------------
// Feature & thought data
// ---------------------------------------------------------------------------

// Ordered most-impressive first — this order drives the flat Apps column, the
// graph's feature cluster, and the signed-in hub grid.
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

// The consolidated Pokémon hub card. Reads as the suite it now stands for: a
// row of TCG cards up top and a couple of Pokédex rows below, so one card hints
// at all three apps behind it.
export function PokemonPreview() {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-4 gap-1">
        {TCG_CARDS.slice(0, 4).map((card) => (
          <div
            key={card.name}
            className={`rounded border border-black/10 dark:border-white/10 bg-gradient-to-br ${card.gradient}`}
            style={{ aspectRatio: "2.5/3.5" }}
          />
        ))}
      </div>
      {GRAPHQL_POKEMON.slice(0, 2).map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2 py-1"
        >
          <div
            className={`h-3.5 w-3.5 shrink-0 rounded-full bg-gradient-to-br ${p.gradient}`}
          />
          <span className="flex-1 truncate text-[9px] text-black/70 dark:text-white/70">
            {p.name}
          </span>
          <span className="rounded bg-black/10 dark:bg-white/10 px-1 py-px text-[7px] text-black/50 dark:text-white/50">
            {p.types[0]}
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

// Mini flag list for the hub card: a status dot, a flag name, and either a
// rollout bar or an "on" pill, echoing the real console.
export const FLAGS_PREVIEW = [
  { name: "pocket-tcg", tone: "#fb923c", pct: 100 },
  { name: "new-checkout", tone: "#22c55e", pct: 25 },
  { name: "dark-mode", tone: "#22c55e", pct: 100 },
];

export function FlagsPreview() {
  return (
    <div className="space-y-1.5">
      {FLAGS_PREVIEW.map((f) => (
        <div
          key={f.name}
          className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/5 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/5"
        >
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: f.tone }}
          />
          <span className="flex-1 truncate font-mono text-[9px] text-black/70 dark:text-white/70">
            {f.name}
          </span>
          <div className="h-1.5 w-8 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${f.pct}%`, backgroundColor: f.tone }}
            />
          </div>
          <span className="shrink-0 tabular-nums text-[8px] text-black/40 dark:text-white/40">
            {f.pct}%
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
const WP_BOTTOM = [
  "Wallet Lookup",
  "LLM Assistant",
  "Dashboard",
  "Email Studio",
];

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

// Mini mockup for the design-system card: a swatch ramp over two pill "buttons",
// reading like a tiny component gallery.
export const DS_SWATCHES = [
  "#a5f3fc",
  "#5eead4",
  "#818cf8",
  "#f9a8d4",
  "#fde68a",
] as const;

export function DesignSystemPreview() {
  return (
    <div className="space-y-2">
      <div className="flex overflow-hidden rounded-md border border-black/10 dark:border-white/10">
        {DS_SWATCHES.map((c) => (
          <div key={c} className="h-4 flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex gap-1.5">
        <div className="rounded-md bg-black/70 px-2.5 py-1 text-[8px] font-semibold text-white dark:bg-white/80 dark:text-black">
          Primary
        </div>
        <div className="rounded-md border border-black/20 px-2.5 py-1 text-[8px] font-semibold text-black/60 dark:border-white/20 dark:text-white/60">
          Outline
        </div>
      </div>
      <div className="flex gap-1.5">
        <span className="rounded bg-black/10 px-1.5 py-0.5 text-[7px] text-black/50 dark:bg-white/10 dark:text-white/50">
          tokens
        </span>
        <span className="rounded bg-black/10 px-1.5 py-0.5 text-[7px] text-black/50 dark:bg-white/10 dark:text-white/50">
          a11y
        </span>
        <span className="rounded bg-black/10 px-1.5 py-0.5 text-[7px] text-black/50 dark:bg-white/10 dark:text-white/50">
          live
        </span>
      </div>
    </div>
  );
}

// A mini skills-matrix: a few trait rows, each a coloured dot, a label bar, and
// a short filled meter, so the card reads like a competency chart at a glance.
export const CRAFT_ROWS = [
  { label: "Performance", color: "#f59e0b", pct: 92 },
  { label: "System Design", color: "#a78bfa", pct: 88 },
  { label: "Libraries", color: "#38bdf8", pct: 84 },
  { label: "Accessibility", color: "#34d399", pct: 90 },
];

export function CraftPreview() {
  return (
    <div className="space-y-1.5">
      {CRAFT_ROWS.map((r) => (
        <div
          key={r.label}
          className="flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-1.5"
        >
          <div
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: r.color }}
          />
          <span className="w-14 shrink-0 truncate text-[8px] font-semibold text-black/60 dark:text-white/60">
            {r.label}
          </span>
          <div
            className="flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
            style={{ height: 3 }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${r.pct}%`, backgroundColor: r.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// A mini gallery wall: a row of little frames in mixed sizes and orientations,
// each a thin mat around a tinted "photo", so the card reads as an arranged wall.
export const GALLERY_FRAMES = [
  { w: 20, h: 28 },
  { w: 32, h: 22 },
  { w: 20, h: 20 },
  { w: 18, h: 26 },
] as const;

export function GalleryWallPreview() {
  return (
    <div className="flex h-full items-center justify-center gap-1.5">
      {GALLERY_FRAMES.map((f, i) => (
        <div
          key={i}
          className="rounded-[2px] border border-black/20 bg-white p-[2px] dark:border-white/20 dark:bg-white/90"
          style={{ width: f.w, height: f.h }}
        >
          <div className="h-full w-full rounded-[1px] bg-gradient-to-br from-fuchsia-300/70 to-violet-400/70" />
        </div>
      ))}
    </div>
  );
}

// A mini night skyline for the Explore Toronto card: CN Tower silhouette,
// lit towers, exhibit dots, and the WASD keys that drive the world.
export const WORLD_SKYLINE = [
  { x: 6, w: 9, h: 22 },
  { x: 17, w: 7, h: 30 },
  { x: 40, w: 8, h: 26 },
  { x: 50, w: 10, h: 34 },
  { x: 62, w: 7, h: 20 },
  { x: 80, w: 9, h: 28 },
  { x: 91, w: 6, h: 16 },
] as const;

export const WORLD_DOTS = [
  { x: 20, color: "#f59e0b" },
  { x: 45, color: "#22c55e" },
  { x: 68, color: "#e879f9" },
  { x: 88, color: "#f43f5e" },
] as const;

export function WorldPreview() {
  return (
    <div className="flex h-full flex-col justify-between">
      <svg viewBox="0 0 100 44" className="w-full" aria-hidden>
        <rect x="0" y="0" width="100" height="44" rx="4" fill="#0b1220" />
        {WORLD_SKYLINE.map((b) => (
          <rect
            key={b.x}
            x={b.x}
            y={42 - b.h}
            width={b.w}
            height={b.h}
            fill="#2c3850"
          />
        ))}
        {/* CN Tower */}
        <rect x="31" y="10" width="2" height="32" fill="#4a5878" />
        <ellipse cx="32" cy="14" rx="3.2" ry="2" fill="#5c6c90" />
        <rect x="31.6" y="4" width="0.8" height="6" fill="#4a5878" />
        <circle cx="32" cy="4" r="0.9" fill="#f43f5e" />
        {WORLD_DOTS.map((d) => (
          <circle key={d.x} cx={d.x} cy={40} r={1.6} fill={d.color} />
        ))}
        <rect x="0" y="42" width="100" height="2" fill="#12263f" />
      </svg>
      <div className="flex items-center justify-center gap-1 pt-1.5">
        {["W", "A", "S", "D"].map((key) => (
          <span
            key={key}
            className="rounded border border-black/15 bg-black/5 px-1.5 py-0.5 font-mono text-[8px] font-bold text-black/50 dark:border-white/15 dark:bg-white/10 dark:text-white/60"
          >
            {key}
          </span>
        ))}
        <span className="ml-1 text-[8px] text-black/40 dark:text-white/40">
          walk the city
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Maps & tokens
// ---------------------------------------------------------------------------

// Maps feature.id to its design-token CSS variable name.
export const FEATURE_TOKEN: Record<string, string> = {
  world: "--color-feature-world",
  "fantasy-nba": "--color-feature-nba",
  pokemon: "--color-feature-tcg",
  calendar: "--color-feature-calendar",
  vitals: "--color-feature-vitals",
  particles: "--color-feature-particles",
  ketsup: "--color-feature-ketsup",
  operator: "--color-feature-operator",
  flags: "--color-feature-flags",
  learn: "--color-feature-learn",
  "work-portfolio": "--color-feature-work-portfolio",
  "design-system": "--color-feature-design-system",
  craft: "--color-feature-craft",
  "gallery-wall": "--color-feature-gallery-wall",
};

// Keyed by feature.id so FeatureCard can look up the right preview without a switch.
export const PREVIEW_MAP: Record<string, React.ComponentType> = {
  world: WorldPreview,
  "fantasy-nba": PlayoffsPreview,
  pokemon: PokemonPreview,
  calendar: CalendarPreview,
  vitals: VitalsPreview,
  particles: ParticlesPreview,
  ketsup: KetsupPreview,
  operator: OperatorPreview,
  flags: FlagsPreview,
  learn: LearnPreview,
  "work-portfolio": WorkPortfolioPreview,
  "design-system": DesignSystemPreview,
  craft: CraftPreview,
  "gallery-wall": GalleryWallPreview,
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
