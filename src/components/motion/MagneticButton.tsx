"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { m, useMotionValue, useSpring } from "framer-motion";
import { useHubReducedMotion } from "@/app/providers";

export type MagneticButtonProps = {
  /** The real control. This wrapper never becomes one itself. */
  children: ReactNode;
  /** How far the control leans toward the pointer, 0 to 1. */
  strength?: number;
  className?: string;
};

/**
 * Leans whatever it wraps toward the pointer, then springs it back.
 *
 * Position lives in motion values, never in state: state would re-render the
 * whole subtree on every pointer move, which is what makes hand-rolled magnetic
 * buttons stutter on anything but a fast desktop.
 *
 * The wrapper adds no role and no tabindex, so the control inside keeps its own
 * semantics and its own focus ring.
 */
export default function MagneticButton({
  children,
  strength = 0.35,
  className,
}: MagneticButtonProps) {
  const reducedMotion = useHubReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18 });
  const springY = useSpring(y, { stiffness: 220, damping: 18 });

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    // Coarse pointers have no hover to speak of, and a touch that shifts the
    // thing it is aiming at is a worse button.
    if (reducedMotion || event.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.div
      ref={ref}
      className={`inline-block ${className ?? ""}`}
      style={{ x: springX, y: springY }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}
    </m.div>
  );
}
