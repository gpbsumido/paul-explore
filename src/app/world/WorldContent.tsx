"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import type { RefObject } from "react";
import { FEATURES } from "@/app/_shared/featureData";
import { EXHIBITS } from "@/lib/world/exhibits";
import { ROADS, LAKE_EDGE_Z, SPAWN } from "@/lib/world/cityLayout";
import { WORLD_BOUNDS } from "@/lib/world/movement";
import { spring, instantTransition } from "@/lib/animations";
import { useWorldKeys } from "./useWorldKeys";
import type { JoystickState, PlayerSnapshot } from "./refs";

const WorldCanvas = dynamic(() => import("./WorldCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
          Building Toronto…
        </span>
      </div>
    </div>
  ),
});

const GLASS_STYLE = {
  background: "rgba(7, 10, 18, 0.6)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.1)",
} as const;

function Key({ children }: { readonly children: string }) {
  return (
    <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/80">
      {children}
    </kbd>
  );
}

// ---------------------------------------------------------------------------
// Minimap — drawn straight in world coordinates via the SVG viewBox, with the
// player arrow updated imperatively from the render loop's shared ref.
// ---------------------------------------------------------------------------

function Minimap({ playerRef }: { readonly playerRef: RefObject<PlayerSnapshot> }) {
  const arrowRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const player = playerRef.current;
      const arrow = arrowRef.current;
      if (player && arrow) {
        const degrees = 180 - (player.heading * 180) / Math.PI;
        arrow.setAttribute("transform", `translate(${player.x} ${player.z}) rotate(${degrees})`);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playerRef]);

  return (
    <div className="rounded-2xl p-2.5" style={GLASS_STYLE}>
      <p className="mb-1.5 px-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">
        Downtown Toronto
      </p>
      <svg
        viewBox={`${WORLD_BOUNDS.minX} ${WORLD_BOUNDS.minZ} 156 144`}
        className="block h-[132px] w-[144px] overflow-hidden rounded-lg bg-black/40"
        aria-label="Minimap of the city with exhibit locations"
        role="img"
      >
        <rect x={-78} y={LAKE_EDGE_Z} width={156} height={66 - LAKE_EDGE_Z} fill="#12263f" />
        {ROADS.map((road) => (
          <line
            key={road.name}
            x1={road.orientation === "ns" ? road.at : road.from}
            y1={road.orientation === "ns" ? road.from : road.at}
            x2={road.orientation === "ns" ? road.at : road.to}
            y2={road.orientation === "ns" ? road.to : road.at}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={road.width / 2}
          >
            <title>{road.name}</title>
          </line>
        ))}
        {EXHIBITS.map((exhibit) => {
          const feature = FEATURES.find((f) => f.id === exhibit.featureId);
          return (
            <circle
              key={exhibit.featureId}
              cx={exhibit.position.x}
              cy={exhibit.position.z}
              r={2.6}
              fill={feature?.color ?? "#ffffff"}
            >
              <title>{`${feature?.title ?? exhibit.featureId} — ${exhibit.landmark}`}</title>
            </circle>
          );
        })}
        <g ref={arrowRef} transform={`translate(${SPAWN.x} ${SPAWN.z})`}>
          <polygon points="0,-4.6 3.4,3.8 0,1.9 -3.4,3.8" fill="#ffffff" stroke="#070a12" strokeWidth={0.8} />
        </g>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Touch joystick, shown only on coarse pointers.
// ---------------------------------------------------------------------------

function Joystick({ joystickRef }: { readonly joystickRef: RefObject<JoystickState> }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  const apply = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current;
      const knob = knobRef.current;
      if (!base || !knob) return;
      const rect = base.getBoundingClientRect();
      const max = rect.width / 2 - 16;
      const rawX = clientX - (rect.left + rect.width / 2);
      const rawY = clientY - (rect.top + rect.height / 2);
      const length = Math.hypot(rawX, rawY);
      const scale = length > max ? max / length : 1;
      const dx = rawX * scale;
      const dy = rawY * scale;
      if (joystickRef.current) {
        joystickRef.current.x = dx / max;
        joystickRef.current.z = dy / max;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    },
    [joystickRef],
  );

  const release = useCallback(() => {
    if (joystickRef.current) {
      joystickRef.current.x = 0;
      joystickRef.current.z = 0;
    }
    if (knobRef.current) knobRef.current.style.transform = "translate(0px, 0px)";
  }, [joystickRef]);

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Movement joystick"
      className="relative flex h-28 w-28 touch-none items-center justify-center rounded-full"
      style={GLASS_STYLE}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        apply(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) apply(e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        ref={knobRef}
        className="h-12 w-12 rounded-full border border-white/25 bg-white/20 transition-transform duration-75"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorldContent() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const playerRef = useRef<PlayerSnapshot>({ x: SPAWN.x, z: SPAWN.z, heading: Math.PI });
  const joystickRef = useRef<JoystickState>({ x: 0, z: 0 });

  const handleActiveExhibit = useCallback((featureId: string | null) => {
    activeIdRef.current = featureId;
    setActiveId(featureId);
  }, []);

  const visit = useCallback(() => {
    const id = activeIdRef.current;
    if (!id) return;
    const feature = FEATURES.find((f) => f.id === id);
    if (feature) router.push(feature.href);
  }, [router]);

  const keysRef = useWorldKeys(visit);

  const activeExhibit = activeId ? EXHIBITS.find((e) => e.featureId === activeId) : null;
  const activeFeature = activeId ? FEATURES.find((f) => f.id === activeId) : null;

  return (
    <main className="relative overflow-hidden bg-black" style={{ height: "calc(100dvh - 3.5rem)" }}>
      <h1 className="sr-only">Explore Toronto — a 3D world of this site&apos;s features</h1>

      <WorldCanvas
        keysRef={keysRef}
        joystickRef={joystickRef}
        playerRef={playerRef}
        prefersReduced={!!prefersReduced}
        onActiveExhibit={handleActiveExhibit}
      />

      {/* controls legend — pointless on touch, hidden there */}
      <div className="absolute left-4 top-4 hidden flex-col gap-2 pointer-fine:flex">
        <div className="flex items-center gap-2 rounded-2xl px-3 py-2" style={GLASS_STYLE}>
          <Key>W</Key>
          <Key>A</Key>
          <Key>S</Key>
          <Key>D</Key>
          <span className="text-[11px] text-white/60">walk</span>
          <span className="text-white/20">·</span>
          <Key>Shift</Key>
          <span className="text-[11px] text-white/60">run</span>
          <span className="text-white/20">·</span>
          <Key>E</Key>
          <span className="text-[11px] text-white/60">visit</span>
        </div>
        <p className="px-1 text-[11px] text-white/40">
          Walk up to a glowing ring to see what&apos;s exhibited there.
        </p>
      </div>

      {/* minimap + accessible exhibit index */}
      <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
        <Minimap playerRef={playerRef} />
        <details className="w-[168px] rounded-2xl" style={GLASS_STYLE}>
          <summary className="cursor-pointer select-none px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/60 hover:text-white/90">
            All exhibits
          </summary>
          <ul className="max-h-56 overflow-y-auto px-2 pb-2">
            {EXHIBITS.map((exhibit) => {
              const feature = FEATURES.find((f) => f.id === exhibit.featureId);
              if (!feature) return null;
              return (
                <li key={exhibit.featureId}>
                  <Link
                    href={feature.href}
                    className="flex items-start gap-2 rounded-lg px-1.5 py-1.5 hover:bg-white/5"
                  >
                    <span
                      aria-hidden
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: feature.color }}
                    />
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold leading-tight text-white/85">
                        {feature.title}
                      </span>
                      <span className="block text-[10px] leading-tight text-white/45">
                        {exhibit.landmark}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      </div>

      {/* touch controls */}
      <div className="absolute bottom-6 left-5 hidden pointer-coarse:block">
        <Joystick joystickRef={joystickRef} />
      </div>

      {/* exhibit placard */}
      <AnimatePresence>
        {activeExhibit && activeFeature && (
          <m.div
            key={activeFeature.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={prefersReduced ? instantTransition : { ...spring.smooth }}
            className="absolute bottom-6 left-1/2 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl p-4"
            style={{
              ...GLASS_STYLE,
              borderColor: `color-mix(in srgb, ${activeFeature.color} 40%, rgba(255,255,255,0.1))`,
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              {activeExhibit.landmark}
            </p>
            <h2 className="mt-0.5 text-[17px] font-semibold" style={{ color: activeFeature.color }}>
              {activeFeature.title}
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-white/70">{activeExhibit.blurb}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="hidden items-center gap-1.5 text-[11px] text-white/50 pointer-fine:flex">
                <Key>E</Key> to visit
              </span>
              <Link
                href={activeFeature.href}
                className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-85"
                style={{ backgroundColor: activeFeature.color }}
              >
                Open {activeFeature.title} →
              </Link>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </main>
  );
}
