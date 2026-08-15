"use client";

import { useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { ACCENT_BAND } from "@/lib/accentBand";
import type { ParticleSceneProps } from "./ParticleScene";

// Canvas loaded client-only — WebGL requires the browser.
const ParticlesCanvas = dynamic(() => import("./ParticlesCanvas"), {
  ssr: false,
  loading: () => null,
});

// ---------------------------------------------------------------------------
// Color palettes — 5 accent-band presets, created once outside the component so
// useMemo in ParticleScene gets a stable reference when the index doesn't change.
// THREE.Color needs a real hex, so these read values off ACCENT_BAND rather than
// a CSS var.
// ---------------------------------------------------------------------------

const PALETTES: THREE.Color[][] = [
  // Cosmic — blue/indigo/violet/teal
  [
    new THREE.Color(ACCENT_BAND.blue),
    new THREE.Color(ACCENT_BAND.indigo),
    new THREE.Color(ACCENT_BAND.violet),
    new THREE.Color(ACCENT_BAND.teal),
  ],
  // Ember — coral/ember/gold/red
  [
    new THREE.Color(ACCENT_BAND.coral),
    new THREE.Color(ACCENT_BAND.ember),
    new THREE.Color(ACCENT_BAND.gold),
    new THREE.Color(ACCENT_BAND.red),
  ],
  // Forest — verdigris/sea/teal/olive
  [
    new THREE.Color(ACCENT_BAND.verdigris),
    new THREE.Color(ACCENT_BAND.sea),
    new THREE.Color(ACCENT_BAND.teal),
    new THREE.Color(ACCENT_BAND.olive),
  ],
  // Twilight — orchid/magenta/violet/rose
  [
    new THREE.Color(ACCENT_BAND.orchid),
    new THREE.Color(ACCENT_BAND.magenta),
    new THREE.Color(ACCENT_BAND.violet),
    new THREE.Color(ACCENT_BAND.rose),
  ],
  // Arctic — the cool end of the band: azure/teal/blue/verdigris
  [
    new THREE.Color(ACCENT_BAND.azure),
    new THREE.Color(ACCENT_BAND.teal),
    new THREE.Color(ACCENT_BAND.blue),
    new THREE.Color(ACCENT_BAND.verdigris),
  ],
];

const PALETTE_LABELS = ["Cosmic", "Ember", "Forest", "Twilight", "Arctic"];
const PALETTE_DOTS = [
  ACCENT_BAND.indigo,
  ACCENT_BAND.coral,
  ACCENT_BAND.verdigris,
  ACCENT_BAND.orchid,
  ACCENT_BAND.azure,
];

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
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="paul-touch-target h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
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
    <main
      className="relative bg-black"
      style={{ height: "calc(100dvh - 3.5rem)" }}
      onPointerMove={handlePointerMove}
    >
      <h1 className="sr-only">Particle System</h1>

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
          <span className="font-mono text-[10px] text-white/70">
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
                  type="button"
                  key={i}
                  onClick={() => setPaletteIndex(i)}
                  title={PALETTE_LABELS[i]}
                  className="paul-touch-target h-6 w-6 rounded-full transition-transform hover:scale-110"
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
              <span className="ml-1 flex items-center text-[10px] text-white/70">
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
              type="button"
              aria-label="Mouse Attraction"
              onClick={() => setMouseAttraction((v) => !v)}
              className="paul-touch-target flex h-5 w-9 items-center rounded-full transition-colors"
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
    </main>
  );
}
