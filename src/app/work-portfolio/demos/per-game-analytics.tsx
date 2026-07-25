"use client";

import { Fragment, useState, type ReactElement } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

type GameConfig = {
  id: string;
  name: string;
  genre: string;
  tint: string;
  seed: number;
};
type Metric = { key: string; label: string; format: (n: number) => string };

// One config drives every title's dashboard; adding a game is a single entry.
const GAMES: GameConfig[] = [
  { id: "a", name: "Game A", genre: "RPG", tint: "#818cf8", seed: 131 },
  { id: "b", name: "Game B", genre: "Racing", tint: "#f472b6", seed: 197 },
  { id: "c", name: "Game C", genre: "Strategy", tint: "#34d399", seed: 233 },
];

const METRICS: Metric[] = [
  { key: "mau", label: "MAU", format: (n) => Math.round(n).toLocaleString() },
  { key: "arpu", label: "ARPU", format: (n) => `$${n.toFixed(2)}` },
  { key: "d30", label: "D30 retention", format: (n) => `${Math.round(n)}%` },
  { key: "spd", label: "Sessions/DAU", format: (n) => n.toFixed(1) },
];

const RANGES: Record<string, [number, number]> = {
  mau: [80000, 500000],
  arpu: [2, 10],
  d30: [12, 34],
  spd: [2, 7],
};

function metricsFor(game: GameConfig): Record<string, number> {
  const rng = makeRng(game.seed);
  const out: Record<string, number> = {};
  for (const m of METRICS) {
    const [lo, hi] = RANGES[m.key];
    out[m.key] = lo + rng() * (hi - lo);
  }
  return out;
}

function rawSeries(seed: number): number[] {
  const rng = makeRng(seed + 7);
  return Array.from({ length: 14 }, (_, i) =>
    roundish(1000 + rng() * 6000 + i * 120),
  );
}

/** Wraps a chart with a definite-height parent so recharts actually draws. */
function DashboardChart({ children }: { children: ReactElement }) {
  return (
    <div className="relative min-h-28 flex-1">
      <ResponsiveContainer
        width="100%"
        height="100%"
        className="!absolute inset-0"
      >
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function SingleDashboard({ game }: { game: GameConfig }) {
  const metrics = metricsFor(game);
  const series = rawSeries(game.seed).map((v, d) => ({ d, v }));
  return (
    <>
      <div
        className="rounded-lg border p-3"
        style={{ borderColor: game.tint, backgroundColor: `${game.tint}14` }}
      >
        <p className="text-[12px] font-semibold" style={{ color: game.tint }}>
          {game.name} · {game.genre}
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {METRICS.map((m) => (
            <div key={m.key}>
              <p className="text-[10px] uppercase tracking-wider text-muted">
                {m.label}
              </p>
              <p className="text-sm font-bold text-foreground">
                {m.format(metrics[m.key])}
              </p>
            </div>
          ))}
        </div>
      </div>
      <DashboardChart>
        <AreaChart data={series} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`g-${game.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={game.tint} stopOpacity={0.5} />
              <stop offset="100%" stopColor={game.tint} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="d" hide />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="v"
            stroke={game.tint}
            fill={`url(#g-${game.id})`}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </DashboardChart>
    </>
  );
}

function CompareDashboard({
  left,
  right,
}: {
  left: GameConfig;
  right: GameConfig;
}) {
  const ml = metricsFor(left);
  const mr = metricsFor(right);
  const sl = rawSeries(left.seed);
  const sr = rawSeries(right.seed);
  const data = sl.map((v, d) => ({ d, left: v, right: sr[d] }));
  return (
    <>
      <div className="rounded-lg border border-border p-3">
        <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 gap-y-1.5 text-[12px]">
          <span />
          <span className="text-right font-semibold" style={{ color: left.tint }}>
            {left.name}
          </span>
          <span className="text-right font-semibold" style={{ color: right.tint }}>
            {right.name}
          </span>
          <span className="text-right text-muted">Δ</span>
          {METRICS.map((m) => {
            const a = ml[m.key];
            const b = mr[m.key];
            const delta = a === 0 ? 0 : ((b - a) / a) * 100;
            const up = delta >= 0;
            return (
              <Fragment key={m.key}>
                <span className="text-muted">{m.label}</span>
                <span className="text-right tabular-nums text-foreground">
                  {m.format(a)}
                </span>
                <span className="text-right tabular-nums text-foreground">
                  {m.format(b)}
                </span>
                <span
                  className="text-right font-medium tabular-nums"
                  style={{ color: up ? "#34d399" : "#f87171" }}
                >
                  {up ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}%
                </span>
              </Fragment>
            );
          })}
        </div>
      </div>
      <DashboardChart>
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <XAxis dataKey="d" hide />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="left"
            stroke={left.tint}
            fill={left.tint}
            fillOpacity={0.12}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="right"
            stroke={right.tint}
            fill={right.tint}
            fillOpacity={0.12}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </DashboardChart>
    </>
  );
}

/**
 * Vignette: portal v1's per-title dashboards. One config array drives every
 * game's dashboard (the reusable-config angle), with a single view that reskins
 * per title and a compare view that diffs two titles' KPIs with deltas.
 */
export default function PerGameAnalyticsDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [gameId, setGameId] = useState(GAMES[0].id);
  const [leftId, setLeftId] = useState(GAMES[0].id);
  const [rightId, setRightId] = useState(GAMES[1].id);

  const game = GAMES.find((g) => g.id === gameId)!;
  const left = GAMES.find((g) => g.id === leftId)!;
  const right = GAMES.find((g) => g.id === rightId)!;

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">
          {feature.title}
        </p>
        <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
          {(["single", "compare"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 capitalize ${
                mode === m
                  ? "bg-black/10 text-foreground dark:bg-white/15"
                  : "text-muted"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "single" ? (
        <>
          <div className="flex self-start overflow-hidden rounded-md border border-border text-[12px]">
            {GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={g.id === gameId}
                onClick={() => setGameId(g.id)}
                className={
                  g.id === gameId
                    ? "px-2.5 py-1 text-white"
                    : "px-2.5 py-1 text-muted"
                }
                style={g.id === gameId ? { backgroundColor: g.tint } : undefined}
              >
                {g.name}
              </button>
            ))}
          </div>
          <SingleDashboard game={game} />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-[12px]">
            <select
              aria-label="Left title"
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-foreground"
            >
              {GAMES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <span className="text-muted">vs</span>
            <select
              aria-label="Right title"
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-foreground"
            >
              {GAMES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <CompareDashboard left={left} right={right} />
        </>
      )}
    </div>
  );
}
