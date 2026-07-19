"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

const TOPICS = ["events.raw", "events.enriched", "billing.tx", "audit.log", "ml.features"];

function topicRows() {
  const rng = makeRng(9090);
  return TOPICS.map((name) => {
    const lag = roundish(rng() * 5000);
    return {
      name,
      partitions: roundish(3 + rng() * 9),
      lag,
      health: lag > 3000 ? "warn" : "ok",
    };
  });
}

/**
 * Vignette: the ops console's streaming dashboard. A topic list with
 * consumer-lag badges and a fake "run script" console that appends output.
 */
export default function StreamingOpsDemo({ feature }: { feature: WorkFeature }) {
  const rows = topicRows();
  const [log, setLog] = useState<string[]>(["$ ready"]);

  const runScript = () => {
    setLog((l) => [
      ...l,
      "$ rebalance-consumers --group analytics",
      "moved 4 partitions, lag draining…",
      "done in 1.2s",
    ]);
  };

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div className="min-h-0 overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="text-muted">
            <tr>
              <th className="pb-1 font-medium">Topic</th>
              <th className="pb-1 text-right font-medium">Parts</th>
              <th className="pb-1 text-right font-medium">Lag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="py-1 text-foreground">{r.name}</td>
                <td className="py-1 text-right text-muted">{r.partitions}</td>
                <td className="py-1 text-right">
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: r.health === "warn" ? "#f59e0b" : "#34d399" }}
                  >
                    {r.lag.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted">Maintenance</span>
        <button
          type="button"
          onClick={runScript}
          className="rounded-md border border-border px-2.5 py-1 text-[11px] text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        >
          Run rebalance script
        </button>
      </div>

      <pre
        aria-label="Script output"
        className="min-h-16 flex-1 overflow-auto rounded-md border border-border bg-black/80 p-2 font-mono text-[11px] text-emerald-300"
      >
        {log.join("\n")}
      </pre>
    </div>
  );
}
