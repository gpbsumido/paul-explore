"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

type Props = {
  /** The frameloop mode to restore when the canvas is back in view.
   *  Use "always" for continuous-animation canvases, "demand" for demand-rendered ones. */
  activeFrameloop?: "always" | "demand";
};

/**
 * R3F scene component (must be placed inside a Canvas).
 * Attaches an IntersectionObserver directly to the WebGL canvas DOM element
 * and switches the R3F frameloop to "never" when the canvas scrolls out of
 * the viewport. Restores activeFrameloop when it returns.
 *
 * This is the canvas-level companion to ModelLazyMount: ModelLazyMount prevents
 * the canvas from mounting until it's near the viewport; PauseWhenOffscreen
 * stops rendering once the mounted canvas scrolls away.
 */
export function PauseWhenOffscreen({ activeFrameloop = "always" }: Props) {
  const { gl, set } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const observer = new IntersectionObserver(
      ([entry]) => {
        set({ frameloop: entry.isIntersecting ? activeFrameloop : "never" });
      },
      { rootMargin: "0px" },
    );

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [gl, set, activeFrameloop]);

  return null;
}
