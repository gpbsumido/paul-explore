"use client";

import { useEffect, useState } from "react";
import nextDynamic from "next/dynamic";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { blobPath } from "@/components/motion/blobPath";
import ModelLazyMount from "@/app/landing/models/ModelLazyMount";

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
 * The phone cut-off. useIsMobile is 767px, one breakpoint too wide: a small
 * tablet has the pixels and the GPU for this, a phone has neither to spare.
 */
const SMALL_SCREEN = "(max-width: 640px)";

/**
 * The object beside the hero headline: a wireframe torus knot in the identity
 * ramp, leaning toward the pointer.
 *
 * It is garnish and it is built to be droppable. The hero composes the same way
 * whether the canvas ever mounts, and three separate conditions send it to a
 * static shape instead: reduced motion, no WebGL, and a phone-sized screen.
 * The fallback is the same seeded generator BlobBackground draws with, so the
 * two agree visually rather than looking like a placeholder.
 */
export default function HeroScene() {
  const reducedMotion = usePrefersReducedMotion();
  const [canRun, setCanRun] = useState(false);

  useEffect(() => {
    // After first paint on purpose. The largest text on the page should not
    // wait behind a WebGL probe, let alone behind three.js parsing.
    const decide = () => {
      const small =
        typeof window !== "undefined" &&
        window.matchMedia(SMALL_SCREEN).matches;
      setCanRun(!small && hasWebGL());
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
      className="pointer-events-none relative aspect-square w-full max-w-md lg:max-w-none"
    >
      {showCanvas ? (
        <ModelLazyMount className="absolute inset-0">
          <HeroKnotCanvas />
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
                stopColor="var(--color-primary-400)"
                stopOpacity="0.85"
              />
              <stop
                offset="70%"
                stopColor="var(--color-primary-600)"
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
