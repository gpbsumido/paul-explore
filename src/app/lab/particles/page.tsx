"use client";

import { useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import type { ParticleSceneProps } from "./ParticleScene";

// Canvas loaded client-only — WebGL requires the browser.
const ParticlesCanvas = dynamic(() => import("./ParticlesCanvas"), {
  ssr: false,
  loading: () => null,
});

// ---------------------------------------------------------------------------
// Color palettes — 5 pastel presets, created once outside the component so
// useMemo in ParticleScene gets a stable reference when the index doesn't change.
// ---------------------------------------------------------------------------

const PALETTES: THREE.Color[][] = [
  // Cosmic — the original blue/indigo/violet/cyan
  [
    new THREE.Color("#3b82f6"),
    new THREE.Color("#6366f1"),
    new THREE.Color("#8b5cf6"),
    new THREE.Color("#06b6d4"),
  ],
  // Ember — rose/orange/amber/red
  [
    new THREE.Color("#f43f5e"),
    new THREE.Color("#fb923c"),
    new THREE.Color("#fbbf24"),
    new THREE.Color("#ef4444"),
  ],
  // Forest — emerald/green/teal/lime
  [
    new THREE.Color("#10b981"),
    new THREE.Color("#22c55e"),
    new THREE.Color("#14b8a6"),
    new THREE.Color("#84cc16"),
  ],
  // Twilight — purple/pink/violet/fuchsia
  [
    new THREE.Color("#a855f7"),
    new THREE.Color("#ec4899"),
    new THREE.Color("#8b5cf6"),
    new THREE.Color("#d946ef"),
  ],
  // Arctic — sky/ice/slate/white
  [
    new THREE.Color("#38bdf8"),
    new THREE.Color("#bae6fd"),
    new THREE.Color("#94a3b8"),
    new THREE.Color("#e0f2fe"),
  ],
];

const PALETTE_LABELS = ["Cosmic", "Ember", "Forest", "Twilight", "Arctic"];
const PALETTE_DOTS = ["#6366f1", "#f43f5e", "#10b981", "#a855f7", "#38bdf8"];

const PARTICLE_COUNT = 160;

// ---------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------

function Slider({
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
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
          {label}
        </span>
        <span className="font-mono text-[10px] text-white/70">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ParticlesPage() {
  const [speedMult, setSpeedMult] = useState(1.5);
  const [connectDist, setConnectDist] = useState(1.5);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [mouseAttraction, setMouseAttraction] = useState(true);

  // Mutable refs so pointer moves don't trigger React re-renders.
  const mouseNDCRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const camTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Stable palette reference — only changes when paletteIndex changes.
  const palette = useMemo(() => PALETTES[paletteIndex], [paletteIndex]);

  const canvasProps: ParticleSceneProps = {
    particleCount: PARTICLE_COUNT,
    speedMult,
    connectDist,
    palette,
    mouseAttraction,
    mouseNDCRef,
    camTargetRef,
  };

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseNDCRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDCRef.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    camTargetRef.current.x = (e.clientX - rect.left) / rect.width - 0.5;
    camTargetRef.current.y = -((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <div
      className="relative bg-black"
      style={{ height: "calc(100dvh - 3.5rem)" }}
      onPointerMove={handlePointerMove}
    >
      {/* R3F Canvas — fills the container */}
      <ParticlesCanvas {...canvasProps} />

      {/* Glass control panel — floats over the canvas */}
      <div
        className="absolute bottom-6 left-1/2 w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl p-4"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Header row */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/60">
            Controls
          </span>
          <span className="font-mono text-[10px] text-white/40">
            {PARTICLE_COUNT} particles
          </span>
        </div>

        <div className="space-y-3">
          <Slider
            label="Speed"
            value={speedMult}
            min={0.2}
            max={3.0}
            step={0.1}
            onChange={setSpeedMult}
            display={speedMult.toFixed(1) + "×"}
          />
          <Slider
            label="Connection Distance"
            value={connectDist}
            min={1.5}
            max={6.0}
            step={0.1}
            onChange={setConnectDist}
            display={connectDist.toFixed(1)}
          />

          {/* Color theme picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Color Theme
            </span>
            <div className="flex gap-2">
              {PALETTE_DOTS.map((dot, i) => (
                <button
                  key={i}
                  onClick={() => setPaletteIndex(i)}
                  title={PALETTE_LABELS[i]}
                  className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: dot,
                    outline:
                      paletteIndex === i
                        ? "2px solid rgba(255,255,255,0.7)"
                        : "2px solid transparent",
                    outlineOffset: "2px",
                  }}
                />
              ))}
              <span className="ml-1 flex items-center text-[10px] text-white/40">
                {PALETTE_LABELS[paletteIndex]}
              </span>
            </div>
          </div>

          {/* Mouse attraction toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Mouse Attraction
            </span>
            <button
              onClick={() => setMouseAttraction((v) => !v)}
              className="flex h-5 w-9 items-center rounded-full transition-colors"
              style={{
                background: mouseAttraction
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(255,255,255,0.1)",
              }}
              aria-pressed={mouseAttraction}
            >
              <span
                className="h-4 w-4 rounded-full bg-white transition-transform"
                style={{
                  transform: mouseAttraction
                    ? "translateX(20px)"
                    : "translateX(2px)",
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
