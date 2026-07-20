"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

const SOURCE = "#818cf8";
const SINK = "#f472b6";

/** Faucet vs sink flow for a game's soft currency, plus health KPIs. */
function buildData() {
  const rng = makeRng(4242);
  const flow = ["Quests", "Sales", "Rewards", "Crafting", "Trades"].map((name) => ({
    name,
    faucet: roundish(200 + rng() * 800),
    sink: roundish(150 + rng() * 700),
  }));
  const net = flow.reduce((sum, r) => sum + r.faucet - r.sink, 0);
  const kpis = [
    { label: "Net supply", value: net.toLocaleString(), tone: net > 0 ? "warn" : "ok" },
    { label: "Sink ratio", value: "0.86", tone: "ok" },
    { label: "Whales", value: "3.2%", tone: "neutral" },
    { label: "Inflation", value: `${(net / 1000).toFixed(1)}%`, tone: net > 0 ? "warn" : "ok" },
  ];
  return { flow, kpis };
}

const TONE: Record<string, string> = {
  ok: "text-emerald-500",
  warn: "text-amber-500",
  neutral: "text-foreground",
};

/**
 * Vignette: portal v1's economy and financial-health views. A faucet-vs-sink
 * bar chart for the in-game currency next to a KPI grid that flags supply
 * pressure.
 */
export default function EconomyHealthDemo({ feature }: { feature: WorkFeature }) {
  const { flow, kpis } = buildData();

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-border p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted">
              {k.label}
            </p>
            <p className={`text-base font-bold ${TONE[k.tone]}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="min-h-32 flex-1" aria-label="Faucet versus sink chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={flow} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="currentColor" />
            <YAxis tick={{ fontSize: 9 }} stroke="currentColor" />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="faucet" name="Faucet" fill={SOURCE} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="sink" name="Sink" fill={SINK} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
