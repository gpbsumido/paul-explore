"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

/** Three renamed client titles, each with its own accent and shape of data. */
const GAMES = [
  { id: "a", name: "Game A", tint: "#818cf8", genre: "RPG" },
  { id: "b", name: "Game B", tint: "#f472b6", genre: "Racing" },
  { id: "c", name: "Game C", tint: "#34d399", genre: "Strategy" },
];

function gameData(id: string) {
  const rng = makeRng(id.charCodeAt(0) * 131);
  const series = Array.from({ length: 14 }, (_, i) => ({
    d: i,
    v: roundish(1000 + rng() * 6000 + i * 120),
  }));
  const kpis = [
    { label: "MAU", value: roundish(50000 + rng() * 400000) },
    { label: "ARPU", value: `$${(2 + rng() * 8).toFixed(2)}` },
    { label: "D30", value: `${roundish(12 + rng() * 20)}%` },
  ];
  return { series, kpis };
}

/**
 * Vignette: portal v1's per-title dashboards. Each client game had its own
 * page; here a switcher reskins one dashboard with the game's accent and
 * its own metrics.
 */
export default function PerGameAnalyticsDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [gameId, setGameId] = useState(GAMES[0].id);
  const game = GAMES.find((g) => g.id === gameId)!;
  const { series, kpis } = gameData(gameId);

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>
        <div className="flex overflow-hidden rounded-md border border-border text-[12px]">
          {GAMES.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={g.id === gameId}
              onClick={() => setGameId(g.id)}
              className={g.id === gameId ? "px-2.5 py-1 text-white" : "px-2.5 py-1 text-muted"}
              style={g.id === gameId ? { backgroundColor: g.tint } : undefined}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-lg border p-3"
        style={{ borderColor: game.tint, backgroundColor: `${game.tint}14` }}
      >
        <p className="text-[12px] font-semibold" style={{ color: game.tint }}>
          {game.name} · {game.genre}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {kpis.map((k) => (
            <div key={k.label}>
              <p className="text-[10px] uppercase tracking-wider text-muted">
                {k.label}
              </p>
              <p className="text-base font-bold text-foreground">
                {typeof k.value === "number" ? k.value.toLocaleString() : k.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-28 flex-1">
        <ResponsiveContainer width="100%" height="100%">
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
        </ResponsiveContainer>
      </div>
    </div>
  );
}
