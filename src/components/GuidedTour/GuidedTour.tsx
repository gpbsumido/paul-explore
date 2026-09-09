"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import type { TourStep } from "./types";

/**
 * A generic click-through coach-mark tour. Step 0 is the consent card; the rest
 * spotlight a real element (by id) and pin a tooltip near it. The host owns
 * whether it's mounted, so it starts fresh at the consent step every open and
 * needs no reset effect. Steps carry their own `onEnter` for any view setup.
 */
export default function GuidedTour({
  label,
  steps,
  onClose,
}: {
  label: string;
  steps: TourStep[];
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const go = (target: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, target));
    steps[next].onEnter?.();
    setStep(next);
  };
  const next = () => (isLast ? onClose() : go(step + 1));
  const back = () => go(step - 1);

  // Measure the anchored element in an animation frame (after any onEnter has
  // re-rendered the page), and keep the spotlight on it through scroll/resize.
  useEffect(() => {
    if (!current.anchor) return;
    const anchor = current.anchor;
    const measure = () => {
      const el = document.getElementById(anchor);
      if (!el) return;
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      setRect(el.getBoundingClientRect());
    };
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [current.anchor]);

  // Move focus to the primary action as each step opens.
  useEffect(() => {
    const id = requestAnimationFrame(() => primaryRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [step]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowRight" && step > 0) next();
    else if (e.key === "ArrowLeft" && step > 0) back();
  };

  if (typeof document === "undefined") return null;

  const spotlight = current.anchor && rect ? rect : null;

  const cardStyle: CSSProperties = spotlight
    ? {
        position: "fixed",
        top: Math.min(spotlight.bottom + 12, window.innerHeight - 220),
        left: Math.max(12, Math.min(spotlight.left, window.innerWidth - 340)),
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };

  return createPortal(
    <div
      className="fixed inset-0"
      style={{ zIndex: 80 }}
      onKeyDown={onKeyDown}
      role="presentation"
    >
      {spotlight ? (
        <div
          aria-hidden
          className="ring-primary-500 pointer-events-none fixed rounded-lg ring-2 transition-all"
          style={{
            top: spotlight.top - 6,
            left: spotlight.left - 6,
            width: spotlight.width + 12,
            height: spotlight.height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-black/60" />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${label} tour`}
        style={cardStyle}
        className="border-border bg-surface w-[min(21rem,calc(100vw-1.5rem))] rounded-2xl border p-4 shadow-xl"
      >
        {step > 0 && (
          <p className="text-muted text-[11px] font-medium tracking-wide uppercase">
            Step {step} of {steps.length - 1}
          </p>
        )}
        <h2 className="text-foreground mt-0.5 text-base font-semibold">
          {current.title}
        </h2>
        <p className="text-muted mt-1.5 text-sm leading-relaxed">
          {current.body}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          {step === 0 ? (
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-foreground rounded-full px-3 py-1.5 text-sm"
            >
              No thanks
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-muted hover:text-foreground rounded-full px-3 py-1.5 text-sm"
              >
                Skip
              </button>
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  className="border-border text-foreground hover:bg-surface-raised rounded-full border px-3 py-1.5 text-sm"
                >
                  Back
                </button>
              )}
            </div>
          )}
          <button
            ref={primaryRef}
            type="button"
            onClick={next}
            className="bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-600 focus-visible:ring-offset-surface rounded-full px-4 py-1.5 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {step === 0 ? "Show me around" : isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
