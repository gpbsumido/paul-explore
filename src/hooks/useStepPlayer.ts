"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  /** Interval between auto-advance ticks while playing. */
  intervalMs?: number;
};

/**
 * The play / step / reset engine shared by the learn-page demos. Each lesson
 * used to hand-roll this ~40-line block (and the same off-by-one bug had to be
 * fixed in all of them). The key detail: the step index is written to a ref
 * synchronously inside advance/play, so batched interval ticks read a fresh
 * value and stop exactly at the last step instead of overrunning the array.
 *
 * @param stepCount total number of steps (the current lesson's steps.length)
 * @returns the current index, playing flag, and controls — plus an onKeyDown
 *   handler so a focusable container gets arrow-key / space control for free.
 */
export function useStepPlayer(stepCount: number, options?: Options) {
  const intervalMs = options?.intervalMs ?? 1000;
  const [stepIdx, setStepIdxState] = useState(0);
  const stepIdxRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Each control writes the ref synchronously (so a batched interval tick reads
  // a fresh index) and mirrors it into state — the pattern the learn pages use.
  // stepCount is a dependency, so the controls close over the current length.
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPlaying(false);
  }, []);

  const advance = useCallback(() => {
    if (stepIdxRef.current >= stepCount - 1) {
      stop();
      return;
    }
    stepIdxRef.current += 1;
    setStepIdxState(stepIdxRef.current);
  }, [stepCount, stop]);

  const back = useCallback(() => {
    if (stepIdxRef.current <= 0) return;
    stepIdxRef.current -= 1;
    setStepIdxState(stepIdxRef.current);
  }, []);

  const reset = useCallback(() => {
    stop();
    stepIdxRef.current = 0;
    setStepIdxState(0);
  }, [stop]);

  const play = useCallback(() => {
    // Replaying from the end restarts from the top.
    if (stepIdxRef.current >= stepCount - 1) {
      stepIdxRef.current = 0;
      setStepIdxState(0);
    }
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      if (document.hidden) return;
      if (stepIdxRef.current >= stepCount - 1) {
        stop();
        return;
      }
      stepIdxRef.current += 1;
      setStepIdxState(stepIdxRef.current);
    }, intervalMs);
  }, [intervalMs, stepCount, stop]);

  const toggle = useCallback(() => {
    if (playing) stop();
    else play();
  }, [play, playing, stop]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        toggle();
      }
    },
    [advance, back, toggle],
  );

  // Clear the interval on unmount.
  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  return {
    stepIdx,
    playing,
    advance,
    back,
    reset,
    play,
    stop,
    toggle,
    onKeyDown,
  };
}
