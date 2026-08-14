"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useHubReducedMotion } from "@/app/providers";

/** Glyphs the decode effect churns through before a character settles. */
export const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/\\<>[]{}=+*#";

export type ScrambleFrameOptions = {
  /** The final string being decoded toward. */
  text: string;
  /** How many leading characters have settled. */
  revealed: number;
  /** Glyph pool for the unsettled tail. */
  charset: string;
  /** Injectable for tests. Defaults to Math.random. */
  random?: () => number;
};

/**
 * Build one frame of the decode effect.
 *
 * Pure on purpose. The rAF loop below only decides how far along we are, and
 * every rule worth pinning down lives here: settle left to right, never touch
 * whitespace, never emit a glyph from outside the charset.
 *
 * Whitespace is preserved because scrambling it collapses word boundaries, and
 * a headline that changes shape while it decodes reads as broken rather than as
 * an effect.
 */
export function scrambleFrame({
  text,
  revealed,
  charset,
  random = Math.random,
}: ScrambleFrameOptions): string {
  return [...text]
    .map((char, index) => {
      if (index < revealed) return char;
      if (/\s/.test(char)) return char;
      return charset[Math.floor(random() * charset.length)] ?? char;
    })
    .join("");
}

export type UseTextScrambleOptions = {
  /** The string to decode toward. */
  text: string;
  /** "mount" starts straight away; "inView" waits for start() to be called. */
  trigger?: "mount" | "inView";
  /** Milliseconds per settled character. Defaults to 40. */
  speedMs?: number;
  /** Glyph pool for the unsettled tail. */
  charset?: string;
};

export type UseTextScrambleResult = {
  /** The current frame to render. */
  display: string;
  /** True while glyphs are still churning. */
  isScrambling: boolean;
  /** Kick the effect off. Safe to call more than once. */
  start: () => void;
};

/**
 * Drive the decode effect over a string.
 *
 * Under reduced motion this never animates at all: display is the final text
 * from the first render, so there is no flicker to suppress later.
 */
export function useTextScramble({
  text,
  trigger = "mount",
  speedMs = 40,
  charset = DEFAULT_CHARSET,
}: UseTextScrambleOptions): UseTextScrambleResult {
  const reducedMotion = useHubReducedMotion();
  const [display, setDisplay] = useState(text);
  // The mount trigger is known at first render, so it belongs in the initial
  // state rather than in an effect that immediately sets it and costs a second
  // render pass.
  const [isScrambling, setIsScrambling] = useState(
    trigger === "mount" && !reducedMotion,
  );
  const frameRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (reducedMotion) return;
    setIsScrambling(true);
  }, [reducedMotion]);

  useEffect(() => {
    if (!isScrambling || reducedMotion) return;

    const began = performance.now();
    const step = () => {
      const elapsed = performance.now() - began;
      const revealed = Math.floor(elapsed / Math.max(speedMs, 1));

      if (revealed >= text.length) {
        setDisplay(text);
        setIsScrambling(false);
        return;
      }

      setDisplay(scrambleFrame({ text, revealed, charset }));
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [isScrambling, reducedMotion, text, speedMs, charset]);

  // The settled string is what SSR renders and what reduced motion keeps, so
  // the text is never missing from the HTML.
  return { display: reducedMotion ? text : display, isScrambling, start };
}
