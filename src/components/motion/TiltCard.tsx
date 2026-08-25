"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { m, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useHubReducedMotion } from "@/app/providers";

export type TiltCardProps = {
  /** The card. This wrapper never becomes an interactive element itself. */
  children: ReactNode;
  /** Maximum tilt at the card's edge, in degrees. */
  maxTiltDeg?: number;
  className?: string;
};

/**
 * Tilts whatever it wraps to face the pointer, then springs it flat.
 *
 * A 3D cousin of MagneticButton: instead of leaning the element toward the
 * cursor it rotates it, so the card turns to look at the mouse. Rotation lives
 * in motion values, never in state, so a pointer move doesn't re-render the
 * subtree — the thing that makes hand-rolled tilt cards stutter.
 *
 * Same restraint as the magnetic wrapper: reduced motion and coarse pointers
 * get nothing, because a card that pivots under a fingertip is a worse card,
 * and it adds no role, so the content keeps its own semantics.
 */
export default function TiltCard({
  children,
  maxTiltDeg = 12,
  className,
}: TiltCardProps) {
  const reducedMotion = useHubReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // Pointer offset from the card centre, normalised to -0.5..0.5.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const springX = useSpring(px, { stiffness: 220, damping: 18 });
  const springY = useSpring(py, { stiffness: 220, damping: 18 });
  // Horizontal offset turns the card around its vertical axis; vertical offset
  // around its horizontal axis, inverted so the top edge leans back when the
  // pointer is high — the card faces the cursor rather than away from it.
  const rotateY = useTransform(springX, [-0.5, 0.5], [-maxTiltDeg, maxTiltDeg]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [maxTiltDeg, -maxTiltDeg]);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((event.clientX - (rect.left + rect.width / 2)) / rect.width);
    py.set((event.clientY - (rect.top + rect.height / 2)) / rect.height);
  };

  const handleLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <m.div
      ref={ref}
      className={className}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
        transformStyle: "preserve-3d",
      }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}
    </m.div>
  );
}
