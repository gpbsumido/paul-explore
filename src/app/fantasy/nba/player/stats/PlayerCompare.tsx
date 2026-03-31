"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { selectChevron } from "@/assets/icons";
import { normalizeStats, LEAGUE_AVERAGES } from "@/lib/fantasyHelpers";
import type { PlayerRow } from "./types";

const DIMENSIONS = [
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "fg_pct", label: "FG%" },
] as const;

type DimKey = (typeof DIMENSIONS)[number]["key"];

interface Props {
  rows: PlayerRow[];
  open: boolean;
}

/**
 * Radar chart panel comparing two players from the loaded roster.
 * Visibility is controlled by the parent via the `open` prop.
 */
export default function PlayerCompare({ rows, open }: Props) {
  const [idA, setIdA] = useState<number | null>(null);
  const [idB, setIdB] = useState<number | null>(null);

  const eligible = rows.filter((r) => r.stats && !r.error);

  const playerA = eligible.find((r) => r.id === idA) ?? null;
  const playerB = eligible.find((r) => r.id === idB) ?? null;

  const normA = playerA?.stats
    ? normalizeStats(playerA.stats, LEAGUE_AVERAGES)
    : null;
  const normB = playerB?.stats
    ? normalizeStats(playerB.stats, LEAGUE_AVERAGES)
    : null;

  const chartData = DIMENSIONS.map(({ key, label }) => ({
    stat: label,
    a: normA?.[key as DimKey] ?? 0,
    b: normB?.[key as DimKey] ?? 0,
  }));

  const selectClass =
    "h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] text-foreground font-sans outline-none appearance-none cursor-pointer transition-colors hover:border-foreground/30 focus:border-foreground/50";
  const selectStyle = {
    backgroundImage: selectChevron,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center",
    paddingRight: "28px",
  };

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-border bg-surface p-4 mb-4">
            {/* Player selectors */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted/60">
                  Player 1
                </label>
                <select
                  className={selectClass}
                  style={selectStyle}
                  value={idA ?? ""}
                  onChange={(e) => setIdA(Number(e.target.value) || null)}
                >
                  <option value="">Select player…</option>
                  {eligible.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted/60">
                  Player 2
                </label>
                <select
                  className={selectClass}
                  style={selectStyle}
                  value={idB ?? ""}
                  onChange={(e) => setIdB(Number(e.target.value) || null)}
                >
                  <option value="">Select player…</option>
                  {eligible.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Radar chart */}
            <div className="mt-4 flex justify-center">
              {playerA || playerB ? (
                <ResponsiveContainer width="100%" height={300} maxHeight={300}>
                  <RadarChart
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                  >
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis
                      dataKey="stat"
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                    />
                    {playerA && (
                      <Radar
                        name={playerA.name}
                        dataKey="a"
                        stroke="#FF6B35"
                        fill="#FF6B35"
                        fillOpacity={0.3}
                      />
                    )}
                    {playerB && (
                      <Radar
                        name={playerB.name}
                        dataKey="b"
                        stroke="#00D4FF"
                        fill="#00D4FF"
                        fillOpacity={0.2}
                      />
                    )}
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-[13px] text-muted/50">
                  Select players to compare
                </div>
              )}
            </div>

            {/* Legend */}
            {(playerA || playerB) && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[12px]">
                {playerA && (
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B35]" />
                    <span className="text-muted">{playerA.name}</span>
                  </div>
                )}
                {playerB && (
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#00D4FF]" />
                    <span className="text-muted">{playerB.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Raw stat comparison */}
            {playerA && playerB && playerA.stats && playerB.stats && (
              <div className="mt-4 overflow-hidden rounded-lg border border-border/50">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-border/50 bg-surface-raised/30">
                      <th className="px-2.5 py-1.5 text-left font-semibold text-muted/60 uppercase tracking-wider">
                        Stat
                      </th>
                      <th className="px-2.5 py-1.5 text-right font-semibold text-[#FF6B35]/80 uppercase tracking-wider">
                        {playerA.name.split(" ").pop()}
                      </th>
                      <th className="px-2.5 py-1.5 text-right font-semibold text-[#00D4FF]/80 uppercase tracking-wider">
                        {playerB.name.split(" ").pop()}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIMENSIONS.map(({ key, label }) => {
                      const valA = playerA.stats![
                        key as keyof typeof playerA.stats
                      ] as number;
                      const valB = playerB.stats![
                        key as keyof typeof playerB.stats
                      ] as number;
                      const fmt =
                        key === "fg_pct"
                          ? (v: number) => `${(v * 100).toFixed(1)}%`
                          : (v: number) => v.toFixed(1);
                      const aWins = valA > valB;
                      const bWins = valB > valA;
                      return (
                        <tr
                          key={key}
                          className="border-b border-border/30 last:border-b-0"
                        >
                          <td className="px-2.5 py-1.5 text-muted/70">
                            {label}
                          </td>
                          <td
                            className={`px-2.5 py-1.5 text-right font-mono tabular-nums ${aWins ? "font-bold text-[#FF6B35]" : "text-muted"}`}
                          >
                            {fmt(valA)}
                          </td>
                          <td
                            className={`px-2.5 py-1.5 text-right font-mono tabular-nums ${bWins ? "font-bold text-[#00D4FF]" : "text-muted"}`}
                          >
                            {fmt(valB)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
