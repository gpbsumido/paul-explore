"use client";

import { useEffect, useRef, useState } from "react";
import nextDynamic from "next/dynamic";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useTheme } from "@/components/ThemeProvider";
import { blobPath } from "@/components/motion/blobPath";
import ModelLazyMount from "@/app/landing/models/ModelLazyMount";
import type { HeroInteraction } from "./HeroKnotCanvas";

/** Three.js is the largest thing this page could pull in, so it arrives late and separately. */
const HeroKnotCanvas = nextDynamic(() => import("./HeroKnotCanvas"), {
  ssr: false,
});

/** Viewbox for the fallback shape. Square keeps the maths simple, as in BlobBackground. */
const SIZE = 200;

/**
 * Whether this browser can actually run the scene.
 *
 * Asking the canvas for a context is the only honest test: a feature-detect on
 * `window.WebGLRenderingContext` is true on machines that then fail to create a
 * context. jsdom returns null here, which is why the fallback is the path the
 * unit tests exercise without staging anything.
 */
function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
    );
  } catch {
    return false;
  }
}

/**
 * The object beside the hero headline: a wireframe shape cycle in the identity
 * ramp, leaning toward the pointer.
 *
 * It is garnish and it is built to be droppable. The hero composes the same way
 * whether the canvas ever mounts, and two conditions send it to a static shape
 * instead: reduced motion, and no WebGL context. Phones run the real thing;
 * the scene is wireframe basic materials at a capped DPR, mounted after first
 * paint and paused offscreen, which is a budget a phone GPU shrugs at. The
 * fallback is the same seeded generator BlobBackground draws with, so the two
 * agree visually rather than looking like a placeholder.
 */
export default function HeroScene() {
  const reducedMotion = usePrefersReducedMotion();
  const { theme } = useTheme();
  const [canRun, setCanRun] = useState(false);

  // Shared with the canvas by mutation, never by state: pointer moves happen
  // per frame and a React render per mousemove would be absurd. The canvas is
  // pointer-events none so the page scrolls through it; this wrapper is what
  // actually hears the pointer, which is also why the lean works at all.
  const interaction = useRef<HeroInteraction>({
    hovering: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    // After first paint on purpose. The largest text on the page should not
    // wait behind a WebGL probe, let alone behind three.js parsing.
    const decide = () => {
      setCanRun(hasWebGL());
    };

    const idle = window.requestIdleCallback?.bind(window);
    if (!idle) {
      const timer = window.setTimeout(decide, 200);
      return () => window.clearTimeout(timer);
    }
    const handle = idle(decide, { timeout: 1500 });
    return () => window.cancelIdleCallback?.(handle);
  }, []);

  const showCanvas = canRun && !reducedMotion;

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square w-full max-w-[260px] sm:max-w-md lg:mx-0 lg:max-w-none"
      onPointerEnter={() => {
        interaction.current.hovering = true;
      }}
      onPointerLeave={() => {
        interaction.current.hovering = false;
      }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        interaction.current.x =
          ((event.clientX - rect.left) / rect.width) * 2 - 1;
        interaction.current.y =
          -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      }}
    >
      {showCanvas ? (
        <ModelLazyMount className="absolute inset-0">
          <HeroKnotCanvas interaction={interaction} dark={theme === "dark"} />
        </ModelLazyMount>
      ) : (
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <radialGradient id="hero-fallback-grad">
              <stop
                offset="0%"
                stopColor="light-dark(var(--color-primary-500), var(--color-primary-400))"
                stopOpacity="0.85"
              />
              <stop
                offset="70%"
                stopColor="light-dark(var(--color-primary-700), var(--color-primary-600))"
                stopOpacity="0.35"
              />
              <stop
                offset="100%"
                stopColor="var(--color-secondary-500)"
                stopOpacity="0.12"
              />
            </radialGradient>
          </defs>
          <path
            d={blobPath({ seed: 5, points: 10, variance: 0.38, size: SIZE })}
            fill="url(#hero-fallback-grad)"
          />
          <path
            d={blobPath({ seed: 11, points: 8, variance: 0.3, size: SIZE })}
            fill="none"
            stroke="var(--color-primary-500)"
            strokeOpacity="0.35"
            strokeWidth="0.6"
          />
        </svg>
      )}
    </div>
  );
}
