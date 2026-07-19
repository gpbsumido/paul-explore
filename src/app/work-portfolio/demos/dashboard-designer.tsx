"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Tooltip,
} from "recharts";
import type { WorkFeature } from "../_data/types";
import { makeRng, roundish } from "./_shared/mock";

const ACCENT = "var(--wp-accent, #60a5fa)";

type WidgetKind = "kpi" | "line" | "bar";
type Widget = { id: number; kind: WidgetKind; title: string; span: 1 | 2 };

const PALETTE: { kind: WidgetKind; title: string }[] = [
  { kind: "kpi", title: "KPI tile" },
  { kind: "line", title: "Trend line" },
  { kind: "bar", title: "Bar chart" },
];

const INITIAL: Widget[] = [
  { id: 1, kind: "kpi", title: "Active players", span: 1 },
  { id: 2, kind: "line", title: "Sessions", span: 2 },
  { id: 3, kind: "bar", title: "Revenue by day", span: 1 },
];

function miniSeries(seed: number) {
  const rng = makeRng(seed);
  return Array.from({ length: 8 }, (_, i) => ({ d: i, v: roundish(100 + rng() * 500) }));
}

/** The visual content of one widget by kind. */
function WidgetBody({ widget }: { widget: Widget }) {
  if (widget.kind === "kpi") {
    return (
      <p className="text-2xl font-bold text-foreground">
        {(widget.id * 4213).toLocaleString()}
      </p>
    );
  }
  const data = miniSeries(widget.id * 17);
  return (
    <div className="h-16">
      <ResponsiveContainer width="100%" height="100%">
        {widget.kind === "line" ? (
          <LineChart data={data}>
            <Tooltip />
            <Line type="monotone" dataKey="v" stroke={ACCENT} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <Tooltip />
            <Bar dataKey="v" fill={ACCENT} radius={[2, 2, 0, 0]} isAnimationActive={false} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Flagship demo for portal v2's dashboard designer. The original used a
 * gridstack drag-drop engine; this rebuilds the idea with a CSS grid you
 * compose from a widget palette. Reorder and resize land in the next commit.
 */
export default function DashboardDesignerDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [widgets, setWidgets] = useState<Widget[]>(INITIAL);
  const [nextId, setNextId] = useState(4);

  const add = (kind: WidgetKind, title: string) => {
    setWidgets((w) => [...w, { id: nextId, kind, title, span: 1 }]);
    setNextId((n) => n + 1);
  };
  const remove = (id: number) => setWidgets((w) => w.filter((x) => x.id !== id));

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted">Add:</span>
          {PALETTE.map((p) => (
            <button
              key={p.kind}
              type="button"
              onClick={() => add(p.kind, p.title)}
              className="rounded-md border border-border px-2 py-0.5 text-[11px] text-foreground hover:bg-black/5 dark:hover:bg-white/10"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      <div
        aria-label="Dashboard canvas"
        className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-dashed border-border p-2"
      >
        {widgets.map((widget) => (
          <div
            key={widget.id}
            data-widget={widget.id}
            className={`flex flex-col gap-1 rounded-lg border border-border bg-background/50 p-2 ${
              widget.span === 2 ? "col-span-2" : "col-span-1"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted">
                {widget.title}
              </span>
              <button
                type="button"
                aria-label={`Remove ${widget.title}`}
                onClick={() => remove(widget.id)}
                className="text-[11px] text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <WidgetBody widget={widget} />
          </div>
        ))}
        {widgets.length === 0 && (
          <p className="col-span-2 py-8 text-center text-[12px] text-muted">
            empty canvas, add a widget above
          </p>
        )}
      </div>
    </div>
  );
}
