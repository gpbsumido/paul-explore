"use client";

import { useEffect, useRef } from "react";

const MOVEMENT_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight",
  "Space",
]);

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable);

/**
 * Tracks which movement keys are held in a ref (so the render loop can read
 * them without re-renders) and fires onInteract for E / Enter. Arrow keys are
 * prevented from scrolling the page, and everything releases on window blur so
 * the avatar never runs off on its own after a tab switch.
 */
export function useWorldKeys(onInteract: () => void) {
  const keysRef = useRef<Set<string>>(new Set());
  const interactRef = useRef(onInteract);

  useEffect(() => {
    interactRef.current = onInteract;
  }, [onInteract]);

  useEffect(() => {
    const handleDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey) return;
      if (MOVEMENT_CODES.has(event.code)) event.preventDefault();
      keysRef.current.add(event.code);
      if (event.code === "KeyE" || event.code === "Enter") interactRef.current();
    };
    const handleUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code);
    };
    const releaseAll = () => keysRef.current.clear();

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    window.addEventListener("blur", releaseAll);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
      window.removeEventListener("blur", releaseAll);
    };
  }, []);

  return keysRef;
}
