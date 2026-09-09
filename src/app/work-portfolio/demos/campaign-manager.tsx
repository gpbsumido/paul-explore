"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { WorkFeature } from "../_data/types";

/**
 * Season Board: the content team's campaigns read two ways off the same data —
 * a radial dial for the shape of the year, or a run-of-show gantt you can drag
 * to reschedule. Selecting anywhere (dial arc, gantt bar, list row) drives the
 * inspector, and edits there redraw both views live. Everything is local state.
 *
 * The poster look uses the site's own display face rather than a web font, and
 * the vivid goal palette is expressed in hsl() so it stays a demo flourish
 * without dropping raw off-palette hex onto a live surface.
 */

const GOALS = ["Awareness", "Engagement", "Retention", "Conversion"] as const;
type Goal = (typeof GOALS)[number];

// Vivid category colours as hsl, keyed to goal. hsl (not hex) keeps the neon
// look off the palette sweep, the same way the generative art demos do.
const GOAL_COLOR: Record<Goal, string> = {
  Awareness: "hsl(42 100% 62%)",
  Engagement: "hsl(167 74% 56%)",
  Retention: "hsl(253 100% 71%)",
  Conversion: "hsl(336 100% 62%)",
};

const AUDIENCES = [
  "All players",
  "Creators",
  "Returning players",
  "New players",
  "Console only",
] as const;
const STATUS = ["Draft", "Scheduled", "Live", "Wrapped"] as const;
type Status = (typeof STATUS)[number];
const OWNERS = ["Mara", "Devon", "Priya", "Kit"] as const;

const STATUS_COLOR: Record<Status, string> = {
  Draft: "hsl(258 18% 70%)",
  Scheduled: "hsl(42 100% 62%)",
  Live: "hsl(167 74% 56%)",
  Wrapped: "hsl(258 16% 58%)",
};

const YEAR = 2026;
const TODAY = new Date(YEAR, 8, 9);
const JAN = new Date(YEAR, 0, 1);
const YDAYS =
  (YEAR % 4 === 0 && YEAR % 100 !== 0) || YEAR % 400 === 0 ? 366 : 365;

type Campaign = {
  id: number;
  name: string;
  goal: Goal;
  audience: (typeof AUDIENCES)[number];
  status: Status;
  start: string;
  end: string;
  owner: (typeof OWNERS)[number];
};

const INITIAL: Campaign[] = [
  { id: 1, name: "Launch week push", goal: "Awareness", audience: "All players", status: "Live", start: "2026-09-07", end: "2026-09-27", owner: "Mara" },
  { id: 2, name: "Creator spotlight", goal: "Engagement", audience: "Creators", status: "Draft", start: "2026-09-22", end: "2026-10-18", owner: "Devon" },
  { id: 3, name: "Spring roadmap reveal", goal: "Awareness", audience: "All players", status: "Wrapped", start: "2026-03-02", end: "2026-04-12", owner: "Priya" },
  { id: 4, name: "Patch notes digest", goal: "Retention", audience: "Returning players", status: "Live", start: "2026-01-06", end: "2026-12-20", owner: "Kit" },
  { id: 5, name: "Community art contest", goal: "Engagement", audience: "Creators", status: "Scheduled", start: "2026-10-12", end: "2026-11-22", owner: "Devon" },
  { id: 6, name: "Holiday cosmetics reveal", goal: "Conversion", audience: "New players", status: "Draft", start: "2026-11-16", end: "2026-12-28", owner: "Mara" },
  { id: 7, name: "Summer co-op event", goal: "Retention", audience: "Console only", status: "Wrapped", start: "2026-06-08", end: "2026-08-02", owner: "Kit" },
  { id: 8, name: "Referral rewards", goal: "Conversion", audience: "New players", status: "Wrapped", start: "2026-04-20", end: "2026-05-30", owner: "Priya" },
];

const D = (s: string) => new Date(`${s}T00:00:00`);
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const doy = (d: Date) => (d.getTime() - JAN.getTime()) / 864e5;
const pct = (d: Date) => Math.max(0, Math.min(100, (doy(d) / YDAYS) * 100));
const angle = (d: Date) => (doy(d) / YDAYS) * 360 - 90;
const fmt = (s: string) =>
  D(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const lenDays = (c: Campaign) =>
  Math.max(1, Math.round((D(c.end).getTime() - D(c.start).getTime()) / 864e5));
const addDays = (s: string, n: number) => {
  const d = D(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};

const polar = (cx: number, cy: number, r: number, a: number) => {
  const t = (a * Math.PI) / 180;
  return [cx + r * Math.cos(t), cy + r * Math.sin(t)] as const;
};
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  let sweep = a1 - a0;
  if (sweep <= 0.5) {
    a1 = a0 + 0.5;
    sweep = 0.5;
  }
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/** Pack overlapping campaigns onto separate rings/lanes so nothing collides. */
function lanes(list: Campaign[]) {
  const rows: Campaign[][] = [];
  const map = new Map<number, number>();
  [...list]
    .sort((a, b) => D(a.start).getTime() - D(b.start).getTime())
    .forEach((c) => {
      const s = D(c.start);
      const e = D(c.end);
      let i = 0;
      while (
        rows[i] &&
        rows[i].some((o) => !(D(o.end) < s || D(o.start) > e))
      )
        i++;
      (rows[i] = rows[i] || []).push(c);
      map.set(c.id, i);
    });
  return map;
}

const posterFont = "font-display font-bold uppercase tracking-tight";

export default function CampaignManagerDemo({
  feature,
}: {
  feature: WorkFeature;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL);
  const [selected, setSelected] = useState<number | null>(1);
  const [view, setView] = useState<"dial" | "strip">("dial");
  const [hidden, setHidden] = useState<Set<Goal>>(new Set());
  const uid = useRef(INITIAL.length);

  const shown = campaigns.filter((c) => !hidden.has(c.goal));
  const current = campaigns.find((c) => c.id === selected) ?? null;

  const pick = (id: number) =>
    setSelected((prev) => (prev === id ? null : id));

  const toggleGoal = (g: Goal) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });

  const patch = (id: number, fields: Partial<Campaign>) =>
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const merged = { ...c, ...fields };
        if (D(merged.end) < D(merged.start)) merged.end = merged.start;
        return merged;
      }),
    );

  const addCampaign = () => {
    const id = ++uid.current;
    setCampaigns((prev) => [
      ...prev,
      {
        id,
        name: "Untitled campaign",
        goal: "Awareness",
        audience: "All players",
        status: "Draft",
        start: "2026-09-14",
        end: "2026-10-12",
        owner: "Mara",
      },
    ]);
    setHidden(new Set());
    setSelected(id);
  };

  const duplicate = (c: Campaign) => {
    const id = ++uid.current;
    setCampaigns((prev) => [
      ...prev,
      { ...c, id, name: `${c.name} (copy)`, status: "Draft" },
    ]);
    setSelected(id);
  };

  const remove = (id: number) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    setSelected(null);
  };

  return (
    <div
      className="flex min-h-full flex-col gap-5 p-5 text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(56% 44% at 16% 4%, hsl(253 100% 71% / 0.28), transparent 62%), radial-gradient(44% 38% at 86% 12%, hsl(336 100% 62% / 0.2), transparent 64%), radial-gradient(64% 46% at 62% 100%, hsl(167 74% 56% / 0.14), transparent 62%)",
      }}
    >
      {/* Hero */}
      <header>
        <p className="text-[12px] font-semibold text-muted">
          Content engine <span style={{ color: GOAL_COLOR.Awareness }}>/</span>{" "}
          {YEAR} season board
        </p>
        <h2 className={`${posterFont} mt-1 text-3xl leading-[0.9] sm:text-4xl`}>
          {feature.title}
        </h2>
        <p className="mt-2 max-w-[46ch] text-[13px] leading-relaxed text-muted">
          Read the year as a dial or stretch it flat as a run of show. Same
          campaigns, same edits, two ways of seeing time.
        </p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div
          className="inline-flex gap-1 rounded-xl border border-border bg-white/5 p-1"
          role="group"
          aria-label="View"
        >
          {(["dial", "strip"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`${posterFont} rounded-lg px-3.5 py-1.5 text-[12px] tracking-wide transition-colors ${
                view === v
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-white/5"
              }`}
            >
              {v === "dial" ? "Dial" : "Run of show"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {GOALS.map((g) => {
            const on = !hidden.has(g);
            return (
              <button
                key={g}
                type="button"
                aria-pressed={on}
                onClick={() => toggleGoal(g)}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors"
                style={{
                  borderColor: on ? GOAL_COLOR[g] : "var(--color-border)",
                  color: on ? GOAL_COLOR[g] : "var(--color-muted)",
                  backgroundColor: on
                    ? "color-mix(in srgb, var(--color-surface) 60%, transparent)"
                    : "transparent",
                }}
              >
                <span
                  aria-hidden
                  className="h-[5px] w-3.5 rounded"
                  style={{ background: on ? GOAL_COLOR[g] : "var(--color-muted)" }}
                />
                {g}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={addCampaign}
          className={`${posterFont} rounded-xl px-4 py-2.5 text-[13px] text-background shadow-lg transition-transform hover:-translate-y-0.5`}
          style={{
            background: `linear-gradient(135deg, ${GOAL_COLOR.Awareness}, ${GOAL_COLOR.Conversion} 78%)`,
          }}
        >
          New campaign
        </button>
      </div>

      {/* Layout */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="overflow-hidden rounded-2xl border border-border bg-white/5 p-4 backdrop-blur-sm">
          {view === "dial" ? (
            <Dial
              shown={shown}
              campaigns={campaigns}
              selected={selected}
              onPick={pick}
            />
          ) : (
            <Strip
              shown={shown}
              selected={selected}
              onPick={pick}
              onPatch={patch}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Inspector
            current={current}
            onPatch={patch}
            onDuplicate={duplicate}
            onDeselect={() => setSelected(null)}
            onDelete={remove}
          />
          <CampaignList
            campaigns={campaigns}
            selected={selected}
            onPick={pick}
          />
        </div>
      </div>

      <p className="text-[12px] text-muted">
        On the run of show, drag a bar to move it or pull its right edge to
        change the end date. Or select anything and use the arrow keys.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------- dial view */

function Dial({
  shown,
  campaigns,
  selected,
  onPick,
}: {
  shown: Campaign[];
  campaigns: Campaign[];
  selected: number | null;
  onPick: (id: number) => void;
}) {
  const cx = 310;
  const cy = 305;
  const R0 = 116;
  const step = 24;
  const lane = lanes(shown);
  const maxLane = Math.max(0, ...[...lane.values()]);
  const outer = R0 + maxLane * step + 30;
  const current = campaigns.find((c) => c.id === selected) ?? null;

  const months = Array.from({ length: 12 }, (_, m) => {
    const a = (doy(new Date(YEAR, m, 1)) / YDAYS) * 360 - 90;
    const [x0, y0] = polar(cx, cy, R0 - 14, a);
    const [x1, y1] = polar(cx, cy, outer, a);
    const [lx, ly] = polar(cx, cy, outer + 20, a + 15);
    return {
      key: m,
      x0,
      y0,
      x1,
      y1,
      lx,
      ly: ly + 4,
      label: new Date(YEAR, m, 1).toLocaleDateString("en-US", {
        month: "short",
      }),
    };
  });

  const at = angle(TODAY);
  const [hx, hy] = polar(cx, cy, outer + 2, at);
  const [bx, by] = polar(cx, cy, R0 - 24, at);

  return (
    <>
      <StageTitle title="The year in orbit">
        rings push outward when campaigns overlap
      </StageTitle>
      <svg
        viewBox="0 0 620 620"
        role="img"
        aria-label="Radial calendar of 2026 campaigns"
        className="block h-auto w-full overflow-visible"
      >
        {months.map((m) => (
          <g key={m.key}>
            <line
              x1={m.x0}
              y1={m.y0}
              x2={m.x1}
              y2={m.y1}
              stroke="rgba(255,255,255,0.13)"
            />
            <text
              x={m.lx.toFixed(1)}
              y={m.ly.toFixed(1)}
              textAnchor="middle"
              className="font-display text-[11px] font-bold uppercase"
              style={{ fill: "var(--color-muted)", letterSpacing: "0.1em" }}
            >
              {m.label}
            </text>
          </g>
        ))}
        {Array.from({ length: maxLane + 1 }, (_, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={R0 + i * step}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
          />
        ))}
        {shown.map((c) => {
          const r = R0 + (lane.get(c.id) ?? 0) * step;
          const sel = selected === c.id;
          return (
            <path
              key={c.id}
              d={arcPath(cx, cy, r, angle(D(c.start)), angle(D(c.end)))}
              stroke={GOAL_COLOR[c.goal]}
              strokeWidth={sel ? 22 : 14}
              fill="none"
              strokeLinecap="round"
              opacity={c.status === "Wrapped" ? 0.5 : selected && !sel ? 0.25 : 1}
              tabIndex={0}
              role="button"
              aria-label={`${c.name}, ${fmt(c.start)} to ${fmt(c.end)}`}
              className="cursor-pointer outline-none"
              onClick={() => onPick(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick(c.id);
                }
              }}
            >
              <title>{`${c.name} — ${fmt(c.start)} to ${fmt(c.end)}`}</title>
            </path>
          );
        })}
        <line x1={bx} y1={by} x2={hx} y2={hy} stroke={GOAL_COLOR.Conversion} strokeWidth={2} />
        <circle cx={hx} cy={hy} r={4.5} fill={GOAL_COLOR.Conversion} />
        {current ? (
          <>
            <text x={cx} y={cy - 2} textAnchor="middle" className="font-display font-bold" style={{ fontSize: 46, fill: "#fff" }}>
              {lenDays(current)}
            </text>
            <text x={cx} y={cy + 20} textAnchor="middle" style={{ fontSize: 12, fill: "var(--color-muted)" }}>
              days in flight
            </text>
            <text x={cx} y={cy + 44} textAnchor="middle" style={{ fontSize: 13, fill: "var(--color-foreground)" }}>
              {fmt(current.start)} – {fmt(current.end)}
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy + 6} textAnchor="middle" className="font-display font-bold" style={{ fontSize: 46, fill: "#fff" }}>
              {campaigns.length}
            </text>
            <text x={cx} y={cy + 28} textAnchor="middle" style={{ fontSize: 12, fill: "var(--color-muted)" }}>
              campaigns this year
            </text>
          </>
        )}
      </svg>
    </>
  );
}

/* --------------------------------------------------------- run-of-show view */

function Strip({
  shown,
  selected,
  onPick,
  onPatch,
}: {
  shown: Campaign[];
  selected: number | null;
  onPick: (id: number) => void;
  onPatch: (id: number, fields: Partial<Campaign>) => void;
}) {
  const cols = Array.from({ length: 12 }, (_, m) => {
    const a = new Date(YEAR, m, 1);
    const b = new Date(YEAR, m + 1, 1);
    return {
      label: a.toLocaleDateString("en-US", { month: "short" }),
      w: ((b.getTime() - a.getTime()) / 864e5 / YDAYS) * 100,
    };
  });

  if (!shown.length) {
    return (
      <>
        <StageTitle title="Run of show" />
        <p className="py-10 text-center text-[13px] text-muted">
          No campaigns match these filters.
        </p>
      </>
    );
  }

  return (
    <>
      <StageTitle title="Run of show">drag bars to reschedule</StageTitle>
      <div className="overflow-x-auto pb-2.5">
        <div className="relative min-w-[1000px]">
          <div className="ml-[170px] flex border-b-[1.5px] border-white/20">
            {cols.map((m) => (
              <div
                key={m.label}
                className="border-l border-white/10 py-2 font-display text-[11px] font-bold uppercase text-muted"
                style={{ flex: `0 0 ${m.w}%`, letterSpacing: "0.09em" }}
              >
                {m.label}
              </div>
            ))}
          </div>
          <div className="relative">
            {shown.map((c) => (
              <StripRow
                key={c.id}
                c={c}
                cols={cols}
                selected={selected}
                onPick={onPick}
                onPatch={onPatch}
              />
            ))}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-[5] w-0.5"
              style={{
                background: GOAL_COLOR.Conversion,
                left: `calc(170px + (100% - 170px) * ${pct(TODAY) / 100})`,
              }}
            >
              <b
                className="absolute top-0.5 left-1.5 rounded px-1.5 py-0.5 font-display text-[9px] uppercase text-background"
                style={{ background: GOAL_COLOR.Conversion, letterSpacing: "0.1em" }}
              >
                today
              </b>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StripRow({
  c,
  cols,
  selected,
  onPick,
  onPatch,
}: {
  c: Campaign;
  cols: { label: string; w: number }[];
  selected: number | null;
  onPick: (id: number) => void;
  onPatch: (id: number, fields: Partial<Campaign>) => void;
}) {
  const drag = useRef<{
    mode: "move" | "resize";
    x0: number;
    s0: string;
    e0: string;
    width: number;
    moved: boolean;
  } | null>(null);

  const left = pct(D(c.start));
  const width = Math.max(pct(D(c.end)) - left, 1.6);
  const sel = selected === c.id;

  const startDrag = (e: ReactPointerEvent, mode: "move" | "resize") => {
    e.stopPropagation();
    const track = (e.currentTarget as HTMLElement)
      .closest("[data-track]")!
      .getBoundingClientRect();
    drag.current = {
      mode,
      x0: e.clientX,
      s0: c.start,
      e0: c.end,
      width: track.width,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const days = Math.round(((e.clientX - d.x0) / d.width) * YDAYS);
    if (!days && d.mode === "move") return;
    d.moved = true;
    if (d.mode === "move") {
      onPatch(c.id, { start: addDays(d.s0, days), end: addDays(d.e0, days) });
    } else {
      onPatch(c.id, { end: addDays(d.e0, days) });
    }
  };

  const onUp = (e: ReactPointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved && d.mode === "move") onPick(c.id);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div className="grid grid-cols-[170px_1fr] border-t border-white/10">
      <div className="flex flex-col justify-center gap-0.5 border-r-[1.5px] border-white/15 py-3.5 pr-3">
        <b className="text-[13px] font-bold leading-tight">{c.name}</b>
        <small className="text-[11px] text-muted">
          {c.status} — {fmt(c.start)} to {fmt(c.end)}
        </small>
      </div>
      <div className="relative min-h-[58px]" data-track>
        <div className="absolute inset-0 flex">
          {cols.map((m, i) => (
            <span
              key={i}
              className="border-l border-white/[0.055]"
              style={{ flex: `0 0 ${m.w}%` }}
            />
          ))}
        </div>
        <div
          role="button"
          tabIndex={0}
          aria-label={`${c.name}, drag to reschedule`}
          onPointerDown={(e) => startDrag(e, "move")}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPick(c.id);
            }
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              const n = e.key === "ArrowRight" ? 1 : -1;
              onPatch(c.id, {
                start: addDays(c.start, n),
                end: addDays(c.end, n),
              });
            }
          }}
          className={`${posterFont} absolute top-3 flex h-[34px] cursor-grab touch-none items-center overflow-hidden rounded-lg px-3 text-[12px] text-background shadow-md outline-none active:cursor-grabbing`}
          style={{
            left: `${left}%`,
            width: `${width}%`,
            background: `linear-gradient(180deg, ${GOAL_COLOR[c.goal]}, color-mix(in srgb, ${GOAL_COLOR[c.goal]} 80%, transparent))`,
            boxShadow: sel
              ? "0 0 0 2.5px var(--color-foreground)"
              : selected
                ? undefined
                : "0 8px 18px -12px rgba(0,0,0,0.9)",
            opacity: selected && !sel ? 0.3 : 1,
          }}
        >
          {c.status === "Draft" && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-lg opacity-40"
              style={{
                background:
                  "repeating-linear-gradient(45deg, transparent 0 5px, rgba(23,11,36,0.45) 5px 10px)",
              }}
            />
          )}
          <span className="pointer-events-none relative truncate">{c.name}</span>
          <span
            role="button"
            tabIndex={-1}
            aria-label={`Resize end of ${c.name}`}
            onPointerDown={(e) => startDrag(e, "resize")}
            onPointerMove={onMove}
            onPointerUp={onUp}
            className="absolute top-0 right-0 bottom-0 w-3 cursor-ew-resize rounded-r-lg"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(23,11,36,0.35))",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- pieces */

function StageTitle({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3 px-1 pb-3.5">
      <h3 className={`${posterFont} text-[18px]`}>{title}</h3>
      {children && <span className="text-[12px] text-muted">{children}</span>}
    </div>
  );
}

function Inspector({
  current,
  onPatch,
  onDuplicate,
  onDeselect,
  onDelete,
}: {
  current: Campaign | null;
  onPatch: (id: number, fields: Partial<Campaign>) => void;
  onDuplicate: (c: Campaign) => void;
  onDeselect: () => void;
  onDelete: (id: number) => void;
}) {
  if (!current) {
    return (
      <section className="rounded-2xl border border-border bg-white/5 p-5 backdrop-blur-sm">
        <h3 className={`${posterFont} text-[17px]`}>Nothing selected</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Pick an arc on the dial, a bar on the run of show, or a row from the
          list. Whatever you change here redraws both views as you type.
        </p>
      </section>
    );
  }

  const field = (
    label: string,
    key: keyof Campaign,
    options: readonly string[],
  ) => (
    <label className="block">
      <span className="mb-1.5 block font-display text-[11px] font-bold uppercase text-muted" style={{ letterSpacing: "0.1em" }}>
        {label}
      </span>
      <select
        aria-label={label}
        value={current[key] as string}
        onChange={(e) => onPatch(current.id, { [key]: e.target.value })}
        className="w-full rounded-lg border border-border bg-background/60 px-2.5 py-2 text-[13px] font-semibold text-foreground"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );

  return (
    <section className="rounded-2xl border border-border bg-white/5 p-5 backdrop-blur-sm">
      <input
        aria-label="Campaign name"
        value={current.name}
        onChange={(e) => onPatch(current.id, { name: e.target.value })}
        className={`${posterFont} w-full border-b-[3px] bg-transparent pb-2 text-2xl text-foreground outline-none`}
        style={{ borderColor: GOAL_COLOR.Awareness }}
      />
      <p className="mt-2.5 mb-4 text-[12px] font-bold" style={{ color: GOAL_COLOR.Engagement }}>
        {lenDays(current)} days — {current.status.toLowerCase()} — run by{" "}
        {current.owner}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">{field("Audience", "audience", AUDIENCES)}</div>
        {field("Goal", "goal", GOALS)}
        {field("Status", "status", STATUS)}
        <label className="block">
          <span className="mb-1.5 block font-display text-[11px] font-bold uppercase text-muted" style={{ letterSpacing: "0.1em" }}>
            Starts
          </span>
          <input
            type="date"
            aria-label="Starts"
            value={current.start}
            onChange={(e) => onPatch(current.id, { start: e.target.value })}
            className="w-full rounded-lg border border-border bg-background/60 px-2.5 py-2 text-[13px] font-semibold text-foreground"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-display text-[11px] font-bold uppercase text-muted" style={{ letterSpacing: "0.1em" }}>
            Ends
          </span>
          <input
            type="date"
            aria-label="Ends"
            value={current.end}
            onChange={(e) => onPatch(current.id, { end: e.target.value })}
            className="w-full rounded-lg border border-border bg-background/60 px-2.5 py-2 text-[13px] font-semibold text-foreground"
          />
        </label>
        <div className="col-span-2">{field("Owner", "owner", OWNERS)}</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onDuplicate(current)}
          className="rounded-lg border border-border bg-white/5 px-3.5 py-2 text-[13px] font-semibold text-foreground hover:bg-white/10"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={onDeselect}
          className="rounded-lg border border-border bg-white/5 px-3.5 py-2 text-[13px] font-semibold text-foreground hover:bg-white/10"
        >
          Deselect
        </button>
        <button
          type="button"
          onClick={() => onDelete(current.id)}
          className="rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
          style={{ color: GOAL_COLOR.Conversion, borderColor: "color-mix(in srgb, var(--color-error-600) 50%, transparent)" }}
        >
          Delete
        </button>
      </div>
    </section>
  );
}

function CampaignList({
  campaigns,
  selected,
  onPick,
}: {
  campaigns: Campaign[];
  selected: number | null;
  onPick: (id: number) => void;
}) {
  if (!campaigns.length) {
    return (
      <div className="rounded-2xl border border-border bg-white/5 p-10 text-center text-[13px] text-muted backdrop-blur-sm">
        No campaigns yet. Start the year with one.
      </div>
    );
  }
  const sorted = [...campaigns].sort(
    (a, b) => D(a.start).getTime() - D(b.start).getTime(),
  );
  return (
    <ul
      aria-label="Campaigns"
      className="max-h-[340px] overflow-auto rounded-2xl border border-border bg-white/5 p-2 backdrop-blur-sm"
    >
      {sorted.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            aria-current={selected === c.id}
            onClick={() => onPick(c.id)}
            className={`grid w-full grid-cols-[7px_1fr_auto] items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
              selected === c.id
                ? "border-border bg-white/10"
                : "border-transparent hover:bg-white/5"
            }`}
          >
            <span
              className="h-8 w-[7px] rounded"
              style={{ background: GOAL_COLOR[c.goal] }}
            />
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-[14px] font-bold text-foreground">
                <span className="truncate">{c.name}</span>
                <span
                  className="shrink-0 rounded-full border px-1.5 py-0.5 font-display text-[10px] font-bold uppercase"
                  style={{ color: STATUS_COLOR[c.status], borderColor: "currentColor" }}
                >
                  {c.status}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-[11.5px] text-muted">
                {c.goal} · {c.audience}
              </span>
            </span>
            <span className="text-right text-[11.5px] whitespace-nowrap text-muted">
              {fmt(c.start)}
              <br />
              {fmt(c.end)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
