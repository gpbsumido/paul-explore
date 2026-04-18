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
 * Defers canvas mount until the container enters the viewport (200px rootMargin).
 * Prevents WebGL context creation for off-screen sections on page load.
 */
export default function ModelLazyMount({ children, style, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
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
