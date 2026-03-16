"use client";

import { useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  Reorder,
  useScroll,
  useTransform,
} from "framer-motion";
import { spring } from "@/lib/animations";

// ---------------------------------------------------------------------------
// Shared glass card style — dark bg, all demos on neutral-950
// ---------------------------------------------------------------------------

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.08)",
};

// ---------------------------------------------------------------------------
// DemoSection — consistent card wrapper for every demo
// ---------------------------------------------------------------------------

function DemoSection({
  title,
  tag,
  description,
  children,
}: {
  title: string;
  tag: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl" style={GLASS}>
      <div className="border-b border-white/8 px-6 py-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[15px] font-semibold text-white">{title}</h2>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/40">
            {tag}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-white/50">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// ControlSlider — shared range input used by Spring and Stagger sections
// ---------------------------------------------------------------------------

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          {label}
        </span>
        <span className="font-mono text-[10px] text-white/60">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-white"
      />
    </div>
  );
}

// ===========================================================================
// 1. Spring Physics Playground
// ===========================================================================

function SpringPlayground() {
  const [stiffness, setStiffness] = useState(200);
  const [damping, setDamping] = useState(28);
  const [mass, setMass] = useState(1.0);

  return (
    <DemoSection
      title="Spring Physics"
      tag="drag"
      description="Drag the puck — it snaps back to the origin with the spring you configure."
    >
      {/* Arena */}
      <div className="relative mb-5 flex h-44 items-center justify-center overflow-hidden rounded-xl bg-black/30">
        {/* Crosshair marks the origin */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15">
          <div className="h-px w-8 bg-white" />
          <div className="absolute h-8 w-px bg-white" />
        </div>
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.3}
          transition={{ type: "spring", stiffness, damping, mass }}
          whileDrag={{ scale: 1.2 }}
          className="flex h-12 w-12 cursor-grab items-center justify-center rounded-full bg-indigo-500 shadow-lg shadow-indigo-900/50 active:cursor-grabbing"
        >
          <span className="pointer-events-none select-none text-[9px] font-bold text-white/70">
            drag
          </span>
        </motion.div>
      </div>
      {/* Sliders */}
      <div className="grid gap-3 sm:grid-cols-3">
        <ControlSlider
          label="Stiffness"
          value={stiffness}
          min={10}
          max={800}
          step={10}
          onChange={setStiffness}
          display={String(stiffness)}
        />
        <ControlSlider
          label="Damping"
          value={damping}
          min={1}
          max={60}
          step={1}
          onChange={setDamping}
          display={String(damping)}
        />
        <ControlSlider
          label="Mass"
          value={mass}
          min={0.1}
          max={4.0}
          step={0.1}
          onChange={setMass}
          display={mass.toFixed(1)}
        />
      </div>
    </DemoSection>
  );
}

// ===========================================================================
// 2. Stagger Grid
// ===========================================================================

const TILE_COLORS = [
  "#6366f1", "#7c3aed", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#fb923c", "#f59e0b",
  "#eab308", "#84cc16", "#22c55e", "#10b981",
];

function StaggerGrid() {
  const [staggerDelay, setStaggerDelay] = useState(0.07);
  const [gridKey, setGridKey] = useState(0);

  return (
    <DemoSection
      title="Stagger Grid"
      tag="stagger"
      description="12 tiles cascade in one by one. Adjust the per-tile delay and replay."
    >
      <motion.div
        key={gridKey}
        className="mb-5 grid grid-cols-6 gap-2"
        variants={{ visible: { transition: { staggerChildren: staggerDelay } } }}
        initial="hidden"
        animate="visible"
      >
        {TILE_COLORS.map((color, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, scale: 0.3, y: 10 },
              visible: { opacity: 1, scale: 1, y: 0 },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="aspect-square rounded-lg"
            style={{ backgroundColor: color }}
          />
        ))}
      </motion.div>
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <ControlSlider
            label="Interval"
            value={staggerDelay}
            min={0.01}
            max={0.3}
            step={0.01}
            onChange={setStaggerDelay}
            display={staggerDelay.toFixed(2) + "s"}
          />
        </div>
        <button
          onClick={() => setGridKey((k) => k + 1)}
          className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/20"
        >
          Replay
        </button>
      </div>
    </DemoSection>
  );
}

// ===========================================================================
// 3. Reorderable List
// ===========================================================================

type ListItem = { id: string; label: string; color: string };

const INITIAL_ITEMS: ListItem[] = [
  { id: "1", label: "Hold and drag to reorder", color: "#6366f1" },
  { id: "2", label: "Items animate with layout prop",  color: "#10b981" },
  { id: "3", label: "Spring physics on drop",          color: "#f43f5e" },
  { id: "4", label: "Built on Framer Reorder.Group",   color: "#f59e0b" },
  { id: "5", label: "No external lib required",        color: "#a855f7" },
];

function ReorderList() {
  const [items, setItems] = useState<ListItem[]>(INITIAL_ITEMS);

  return (
    <DemoSection
      title="Reorderable List"
      tag="layout"
      description="Drag rows to reorder. Framer's layout prop smoothly repositions the siblings."
    >
      <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
        {items.map((item) => (
          <Reorder.Item
            key={item.id}
            value={item}
            style={{ touchAction: "none" }}
            className="flex cursor-grab items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] text-white/80 active:cursor-grabbing"
            whileDrag={{ scale: 1.03, background: "rgba(255,255,255,0.1)" }}
          >
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="flex-1">{item.label}</span>
            <span className="shrink-0 select-none text-[12px] text-white/20">⠿</span>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </DemoSection>
  );
}

// ===========================================================================
// 4. Scroll-driven Parallax
// ===========================================================================

function ScrollParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });

  const yBack  = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const yMid   = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const scale  = useTransform(scrollYProgress, [0, 1], [1, 1.5]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.2]);

  return (
    <DemoSection
      title="Scroll Parallax"
      tag="useScroll"
      description="Three layers tied to the container's scroll position — y, scale, and rotate."
    >
      <div
        ref={containerRef}
        className="relative h-52 overflow-y-scroll rounded-xl bg-black/30"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="relative h-[480px]">
          {/* Back — slow drift */}
          <motion.div
            style={{ y: yBack, opacity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-32 w-44 rounded-2xl bg-indigo-950/80 border border-indigo-800/40" />
          </motion.div>

          {/* Mid — faster drift + scales up */}
          <motion.div
            style={{ y: yMid, scale }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-20 w-28 rounded-xl bg-violet-700/70" />
          </motion.div>

          {/* Front — rotates */}
          <motion.div
            style={{ rotate }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-12 w-12 rounded-lg bg-white/20 shadow-lg" />
          </motion.div>

          <div className="absolute bottom-6 right-4 animate-bounce text-[10px] text-white/25">
            scroll ↓
          </div>
        </div>
      </div>
    </DemoSection>
  );
}

// ===========================================================================
// 5. Gesture Variants
// ===========================================================================

type GestureState = "idle" | "hover" | "tap" | "drag";

const GESTURE_COLORS: Record<GestureState, string> = {
  idle:  "#6366f1",
  hover: "#8b5cf6",
  tap:   "#a855f7",
  drag:  "#7c3aed",
};

const GESTURE_LABELS: Record<GestureState, string> = {
  idle:  "Waiting for input",
  hover: "Pointer hovering",
  tap:   "Pointer pressed",
  drag:  "Being dragged",
};

function GestureCard() {
  const [state, setState] = useState<GestureState>("idle");

  return (
    <DemoSection
      title="Gesture Variants"
      tag="gestures"
      description="Hover, tap, and drag the card. The state panel updates in real time."
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.2}
          whileHover={{ scale: 1.08, rotate: 3 }}
          whileTap={{ scale: 0.93, rotate: -3 }}
          whileDrag={{ scale: 1.1, rotate: 6 }}
          onHoverStart={() => setState("hover")}
          onHoverEnd={() => setState("idle")}
          onTapStart={() => setState("tap")}
          onTap={() => setState("idle")}
          onTapCancel={() => setState("idle")}
          onDragStart={() => setState("drag")}
          onDragEnd={() => setState("idle")}
          transition={{ ...spring.bounce }}
          className="flex h-32 w-32 shrink-0 cursor-grab items-center justify-center rounded-2xl shadow-xl active:cursor-grabbing"
          style={{ background: GESTURE_COLORS[state] }}
          aria-label="Gesture demo card"
        >
          <span className="pointer-events-none select-none text-[11px] font-semibold text-white/80">
            {state}
          </span>
        </motion.div>

        {/* Live state panel */}
        <div className="w-full flex-1 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-[9px] font-bold uppercase tracking-widest text-white/30">
            Live State
          </p>
          <div className="flex items-center gap-2">
            <motion.div
              key={state}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: GESTURE_COLORS[state] }}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.25 }}
            />
            <span className="font-mono text-sm font-semibold text-white">{state}</span>
          </div>
          <p className="mt-1 text-[12px] text-white/40">{GESTURE_LABELS[state]}</p>
          <div className="mt-4 grid grid-cols-2 gap-1.5">
            {(Object.keys(GESTURE_COLORS) as GestureState[]).map((s) => (
              <div
                key={s}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${
                  state === s ? "bg-white/10 text-white" : "text-white/25"
                }`}
              >
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: GESTURE_COLORS[s] }}
                />
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoSection>
  );
}

// ===========================================================================
// 6. Shared Layout
// ===========================================================================

type LayoutItem = { id: string; color: string; label: string; desc: string };

const LAYOUT_ITEMS: LayoutItem[] = [
  {
    id: "alpha",
    color: "#6366f1",
    label: "Alpha",
    desc: "Click any card — it morphs from its grid slot to a full overlay using layoutId. No positional math.",
  },
  {
    id: "beta",
    color: "#10b981",
    label: "Beta",
    desc: "Siblings stay in place while the selected card expands. Click the overlay to collapse it back.",
  },
  {
    id: "gamma",
    color: "#f43f5e",
    label: "Gamma",
    desc: "The title text has its own layoutId, so it moves independently from the card shape during transition.",
  },
];

function SharedLayout() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedItem = LAYOUT_ITEMS.find((i) => i.id === selected);

  return (
    <DemoSection
      title="Shared Layout"
      tag="layoutId"
      description="Click a card to expand it. Framer morphs the shape, position, and title together."
    >
      <LayoutGroup>
        {/* min-h keeps the container tall enough for the expanded overlay */}
        <div className="relative" style={{ minHeight: "11rem" }}>
          <div className="grid grid-cols-3 gap-3">
            {LAYOUT_ITEMS.map((item) =>
              selected === item.id ? (
                // Invisible placeholder preserves the grid slot
                <div
                  key={item.id}
                  className="h-20 rounded-xl"
                  style={{ background: `${item.color}18` }}
                />
              ) : (
                <motion.div
                  key={item.id}
                  layoutId={item.id}
                  onClick={() => setSelected(item.id)}
                  className="flex h-20 cursor-pointer flex-col justify-end rounded-xl p-3"
                  style={{ background: `${item.color}88` }}
                  whileHover={{ scale: 1.04 }}
                  transition={{ ...spring.smooth }}
                >
                  <motion.span
                    layoutId={`title-${item.id}`}
                    className="text-[11px] font-bold text-white"
                  >
                    {item.label}
                  </motion.span>
                </motion.div>
              ),
            )}
          </div>

          <AnimatePresence>
            {selected && selectedItem && (
              <motion.div
                key="expanded"
                layoutId={selected}
                className="absolute inset-0 z-10 cursor-pointer rounded-2xl p-5"
                style={{
                  background: `${selectedItem.color}cc`,
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
                onClick={() => setSelected(null)}
                transition={{ ...spring.smooth }}
              >
                <motion.p
                  layoutId={`title-${selected}`}
                  className="text-lg font-bold text-white"
                >
                  {selectedItem.label}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.18 } }}
                  exit={{ opacity: 0 }}
                  className="mt-2 text-[13px] leading-relaxed text-white/80"
                >
                  {selectedItem.desc}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.26 } }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-[10px] text-white/40"
                >
                  tap to collapse ↩
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </DemoSection>
  );
}

// ===========================================================================
// Page
// ===========================================================================

export default function MotionPage() {
  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-50">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Motion Lab</h1>
          <p className="mt-1.5 text-[14px] text-neutral-400">
            Six interactive Framer Motion demos — spring physics, stagger, layout
            reorder, scroll parallax, gesture tracking, and shared layout transitions.
          </p>
        </div>

        <SpringPlayground />
        <StaggerGrid />
        <ReorderList />
        <ScrollParallax />
        <GestureCard />
        <SharedLayout />
      </div>
    </div>
  );
}
