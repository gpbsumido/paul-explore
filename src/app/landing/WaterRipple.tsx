"use client";

import { useRef, useEffect, useCallback } from "react";
import { WaveSim, HERO_COLORS, type WaterColorConfig } from "./waveSim";

// One ambient drip every ~100 frames (about 1.7 s at 60 fps).
const AMBIENT_PERIOD = 100;

export type { WaterColorConfig };
export { HERO_COLORS };

interface WaterRippleProps {
  className?: string;
  colors?: WaterColorConfig;
}

/**
 * Canvas-based interactive water-ripple simulation.
 * Tracks the mouse via a window listener and computes local canvas coordinates
 * from getBoundingClientRect. No external imperative ref needed.
 * Pauses the RAF loop when scrolled out of view (IntersectionObserver).
 */
export default function WaterRipple({
  className,
  colors = HERO_COLORS,
}: WaterRippleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1, y: -1 });
  const lastDisturbRef = useRef({ x: -1, y: -1 });
  const isVisibleRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  // Live colour target, read each frame so prop updates take effect immediately.
  const colorsRef = useRef(colors);
  const simRef = useRef<WaveSim | null>(null);

  // Keep colorsRef in sync with the prop without recreating the effect.
  useEffect(() => {
    colorsRef.current = colors;
  }, [colors]);

  // --- helpers ---------------------------------------------------------------

  const initSim = useCallback((cw: number, ch: number) => {
    simRef.current = new WaveSim(cw, ch, { disturbRadius: 6 });
    lastDisturbRef.current = { x: -1, y: -1 };
  }, []);

  // --- main effect -----------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- resize ----
    const resize = () => {
      const w = canvas.offsetWidth,
        h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w;
      canvas.height = h;
      initSim(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // --- visibility ----
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    // --- mouse ----
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        mouseRef.current = { x, y };
      } else {
        mouseRef.current = { x: -1, y: -1 };
        lastDisturbRef.current = { x: -1, y: -1 };
      }
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // --- animation loop ----
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);

      // Skip computation when not visible (saves CPU for off-screen sections).
      if (!isVisibleRef.current) return;
      frameRef.current++;

      const sim = simRef.current;
      if (!sim) return;

      // Mouse disturbance, only when the sim-grid position has changed.
      const m = mouseRef.current;
      const ld = lastDisturbRef.current;
      if (m.x >= 0 && m.y >= 0) {
        const sx = Math.floor(m.x / sim.scale);
        const sy = Math.floor(m.y / sim.scale);
        if (sx !== ld.x || sy !== ld.y) {
          sim.disturb(sx, sy, sim.disturbStrength);
          ld.x = sx;
          ld.y = sy;
        }
      }

      // Ambient drips so the water is never completely still.
      if (frameRef.current % AMBIENT_PERIOD === 0) {
        sim.disturb(
          1 + Math.floor(Math.random() * (sim.simW - 2)),
          1 + Math.floor(Math.random() * (sim.simH - 2)),
          Math.round(sim.disturbStrength * 0.14),
        );
      }

      sim.propagate();
      sim.renderPhong(ctx, canvas.width, canvas.height, colorsRef.current);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [initSim]);

  return <canvas ref={canvasRef} className={className} />;
}
