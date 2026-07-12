import { useRef, useState, useCallback, useEffect } from "react";

type AutoScrollResult = {
  readonly containerRef: React.RefObject<HTMLElement | null>;
  readonly isAtBottom: boolean;
  readonly scrollToBottom: () => void;
};

const DEFAULT_THRESHOLD = 100;

/**
 * Tracks whether a scrollable container is near the bottom
 * and provides a function to smoothly scroll to the bottom.
 * Attaches a passive scroll listener to avoid blocking the main thread.
 */
export function useAutoScroll(threshold = DEFAULT_THRESHOLD): AutoScrollResult {
  const containerRef = useRef<HTMLElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setIsAtBottom(distance <= threshold);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  });

  return { containerRef, isAtBottom, scrollToBottom };
}
