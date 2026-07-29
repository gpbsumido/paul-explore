"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createWorldAudio, type WorldAudio } from "./engine";

const MUTED_KEY = "world-muted";

/**
 * Owns the audio engine. Browsers won't let a page make noise until the
 * visitor has interacted, so the context is built on the first key press or
 * pointer down and never before.
 */
export function useWorldAudio(enabled: boolean) {
  const audioRef = useRef<WorldAudio | null>(null);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is browser-only; reading it during render desyncs hydration
    setMuted(window.localStorage.getItem(MUTED_KEY) !== "on");
  }, []);

  // The first real interaction wakes the city up, unless it's muted.
  useEffect(() => {
    if (!enabled || muted || started) return;
    const start = () => {
      if (audioRef.current) return;
      audioRef.current = createWorldAudio();
      audioRef.current?.setMuted(false);
      setStarted(true);
    };
    window.addEventListener("keydown", start, { once: true });
    window.addEventListener("pointerdown", start, { once: true });
    return () => {
      window.removeEventListener("keydown", start);
      window.removeEventListener("pointerdown", start);
    };
  }, [enabled, muted, started]);

  useEffect(() => {
    audioRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(
    () => () => {
      audioRef.current?.dispose();
      audioRef.current = null;
    },
    [],
  );

  const toggleMuted = useCallback(() => {
    setMuted((wasMuted) => {
      const next = !wasMuted;
      window.localStorage.setItem(MUTED_KEY, next ? "off" : "on");
      // Unmuting is itself the gesture the browser was waiting for.
      if (!next && !audioRef.current) {
        audioRef.current = createWorldAudio();
        setStarted(true);
      }
      audioRef.current?.setMuted(next);
      return next;
    });
  }, []);

  return { audioRef, muted, toggleMuted };
}
