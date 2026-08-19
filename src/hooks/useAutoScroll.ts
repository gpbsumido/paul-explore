import { useState, useCallback, useEffect } from "react";

type AutoScrollResult = {
  readonly containerRef: (el: HTMLElement | null) => void;
  readonly isAtBottom: boolean;
  readonly scrollToBottom: () => void;
};

const DEFAULT_THRESHOLD = 100;

/**
 * Tracks whether a scrollable container is near the bottom and provides a
 * function to smoothly scroll to the bottom. Attaches a passive scroll listener
 * to avoid blocking the main thread.
 *
 * `containerRef` is a callback ref: it stores the element in state when React
 * attaches it, so the listener effect depends on the actual element and runs
 * once when it mounts (and once more only if it unmounts/remounts). An earlier
 * version used a ref object with a dependency-less effect, which re-attached the
 * listener on every render.
 */
export function useAutoScroll(threshold = DEFAULT_THRESHOLD): AutoScrollResult {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const containerRef = useCallback((el: HTMLElement | null) => {
    setContainer(el);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [container]);

  useEffect(() => {
    if (!container) return;

    const handleScroll = () => {
      const distance =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setIsAtBottom(distance <= threshold);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [container, threshold]);

  return { containerRef, isAtBottom, scrollToBottom };
}
