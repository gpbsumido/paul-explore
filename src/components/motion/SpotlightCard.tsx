"use client";

import {
  type ComponentPropsWithoutRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useRef,
} from "react";
import { useHubReducedMotion } from "@/app/providers";

/**
 * ReactBits-style "spotlight card": a soft radial glow tracks the pointer
 * across the surface. The position rides on CSS custom properties the pointer
 * handler writes, so the glow itself is drawn in `globals.css`. Under reduced
 * motion the handler is a no-op and the glow stays put.
 */
export default function SpotlightCard({
  children,
  className = "",
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "children">) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useHubReducedMotion();

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={`motion-spotlight ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
