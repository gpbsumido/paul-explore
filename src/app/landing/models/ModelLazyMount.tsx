"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type Props = {
  children: ReactNode;
  /** Forwarded to the wrapper div — lets each section pass its own size/position. */
  style?: CSSProperties;
  className?: string;
};

/**
 * Bidirectional lazy-mount for WebGL canvases. Mounts children when the
 * container enters a 200px margin around the viewport, unmounts when it
 * scrolls more than 1000px away. This keeps the number of live WebGL
 * contexts low — browsers limit contexts to ~8-16 before evicting old
 * ones, causing expensive context restoration flicker.
 *
 * PauseWhenOffscreen (inside the Canvas) handles the frame loop;
 * this component handles the context lifecycle itself.
 */
export default function ModelLazyMount({ children, style, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setMounted(entry.isIntersecting);
      },
      { rootMargin: "1000px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={style} className={className}>
      {mounted ? children : null}
    </div>
  );
}
