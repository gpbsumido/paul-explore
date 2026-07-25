"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
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
const END_ZONE = "end";

type WidgetKind = "kpi" | "line" | "bar";
type Widget = { id: number; kind: WidgetKind; title: string; span: 1 | 2 };

/**
 * Move a widget so it lands in front of the widget it was dropped on, or at
 * the end when dropped on the trailing empty area. This is what makes dropping
 * into an empty upper cell reliable: you reorder into any slot, not just onto
 * an occupied one.
 */
export function reorderWidgets(
  widgets: Widget[],
  activeId: number,
  overId: number | typeof END_ZONE,
): Widget[] {
  if (activeId === overId) return widgets;
  const from = widgets.findIndex((w) => w.id === activeId);
  if (from === -1) return widgets;
  const next = [...widgets];
  const [moved] = next.splice(from, 1);
  if (overId === END_ZONE) {
    next.push(moved);
    return next;
  }
  const to = next.findIndex((w) => w.id === overId);
  if (to === -1) return widgets;
  next.splice(to, 0, moved);
  return next;
}

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

/** One widget: a drag handle to pick it up and a drop target so others can land in front of it. */
function WidgetCell({
  widget,
  onMove,
  onToggleSpan,
  onRemove,
}: {
  widget: Widget;
  onMove: (id: number, dir: -1 | 1) => void;
  onToggleSpan: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const drag = useDraggable({ id: widget.id });
  const drop = useDroppable({ id: widget.id });
  const setRefs = (node: HTMLElement | null) => {
    drag.setNodeRef(node);
    drop.setNodeRef(node);
  };
  return (
    <div
      ref={setRefs}
      data-widget={widget.id}
      style={{
        transform: drag.transform
          ? `translate3d(${drag.transform.x}px, ${drag.transform.y}px, 0)`
          : undefined,
        opacity: drag.isDragging ? 0.4 : 1,
      }}
      className={`flex flex-col gap-1 rounded-lg border bg-background/50 p-2 ${
        widget.span === 2 ? "col-span-2" : "col-span-1"
      } ${drop.isOver ? "border-2" : "border border-border"}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span
          {...drag.listeners}
          {...drag.attributes}
          className="cursor-grab truncate text-[11px] font-medium text-muted active:cursor-grabbing"
        >
          {widget.title}
        </span>
        <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-muted">
          <IconButton size="sm" aria-label={`Move ${widget.title} left`} onClick={() => onMove(widget.id, -1)} className="!h-5 !w-5">
            ‹
          </IconButton>
          <IconButton size="sm" aria-label={`Move ${widget.title} right`} onClick={() => onMove(widget.id, 1)} className="!h-5 !w-5">
            ›
          </IconButton>
          <IconButton
            size="sm"
            aria-label={`Resize ${widget.title}`}
            aria-pressed={widget.span === 2}
            onClick={() => onToggleSpan(widget.id)}
            className="!h-5 !w-5"
          >
            {widget.span === 2 ? "▢" : "▭"}
          </IconButton>
          <IconButton size="sm" aria-label={`Remove ${widget.title}`} onClick={() => onRemove(widget.id)} className="!h-5 !w-5">
            ✕
          </IconButton>
        </span>
      </div>
      <WidgetBody widget={widget} />
    </div>
  );
}

/** Trailing drop target so a widget can be dragged into the empty space after the last one. */
function EndZone() {
  const { setNodeRef, isOver } = useDroppable({ id: END_ZONE });
  return (
    <div
      ref={setNodeRef}
      className={`col-span-2 flex items-center justify-center rounded-lg border border-dashed py-3 text-[11px] text-muted ${
        isOver ? "border-2" : "border-border"
      }`}
      style={isOver ? { borderColor: ACCENT } : undefined}
    >
      drop here to move to the end
    </div>
  );
}

/**
 * Flagship demo for portal v2's dashboard designer. The original used a
 * gridstack drag-drop engine; this rebuilds the idea with a dnd-kit grid you
 * compose from a widget palette. Drag a widget by its title onto another to
 * drop it into that slot, or onto the trailing zone to send it to the end,
 * so empty cells fill reliably. Keyboard move and resize stay on the buttons.
 */
export default function DashboardDesignerDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [widgets, setWidgets] = useState<Widget[]>(INITIAL);
  const [nextId, setNextId] = useState(4);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const add = (kind: WidgetKind, title: string) => {
    setWidgets((w) => [...w, { id: nextId, kind, title, span: 1 }]);
    setNextId((n) => n + 1);
  };
  const remove = (id: number) => setWidgets((w) => w.filter((x) => x.id !== id));

  const toggleSpan = (id: number) =>
    setWidgets((w) =>
      w.map((x) => (x.id === id ? { ...x, span: x.span === 1 ? 2 : 1 } : x)),
    );

  /** Move a widget one slot in a direction, used by the reorder buttons. */
  const move = (id: number, dir: -1 | 1) =>
    setWidgets((w) => {
      const from = w.findIndex((x) => x.id === id);
      const to = from + dir;
      if (from === -1 || to < 0 || to >= w.length) return w;
      const next = [...w];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });

  const onDragEnd = (e: DragEndEvent) => {
    const over = e.over?.id;
    if (over === undefined) return;
    const overId = over === END_ZONE ? END_ZONE : Number(over);
    setWidgets((w) => reorderWidgets(w, Number(e.active.id), overId));
  };

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted">Add:</span>
          {PALETTE.map((p) => (
            <Button
              key={p.kind}
              variant="outline"
              size="xs"
              onClick={() => add(p.kind, p.title)}
            >
              {p.title}
            </Button>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div
          aria-label="Dashboard canvas"
          className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-dashed border-border p-2"
        >
          {widgets.map((widget) => (
            <WidgetCell
              key={widget.id}
              widget={widget}
              onMove={move}
              onToggleSpan={toggleSpan}
              onRemove={remove}
            />
          ))}
          {widgets.length === 0 ? (
            <p className="col-span-2 py-8 text-center text-[12px] text-muted">
              empty canvas, add a widget above
            </p>
          ) : (
            <EndZone />
          )}
        </div>
      </DndContext>
    </div>
  );
}
