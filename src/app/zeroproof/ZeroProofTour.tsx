"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

export type TourTab = "board" | "leagues" | "leaderboard" | "record";

type Step = {
  /** id of the element to spotlight; absent for the centred consent step. */
  anchor?: string;
  /** switch the lobby to this tab when the step opens. */
  tab?: TourTab;
  title: string;
  body: string;
};

/**
 * The tour steps. Step 0 asks first (a consent card, no spotlight); the rest
 * are coach-marks anchored to the lobby's real elements, and switch to the tab
 * they describe so its panel shows behind the highlight.
 */
const STEPS: Step[] = [
  {
    title: "Take a quick tour?",
    body: "New to ZeroProof? I'll walk you through what it is and how to use it — a few clicks, no commitment.",
  },
  {
    anchor: "zp-intro",
    title: "Betting, with the loss removed",
    body: "Lock a simulated deposit, bet real lines, get the deposit back at term end whatever your record — and the record is yours to keep.",
  },
  {
    anchor: "zp-tab-board",
    tab: "board",
    title: "The board",
    body: "Browse upcoming games and their live lines. Tap an outcome and it drops onto your bet slip.",
  },
  {
    anchor: "zp-tab-leagues",
    tab: "leagues",
    title: "Leagues",
    body: "Start your own contest — create a league, set the rules, and invite friends to a private leaderboard.",
  },
  {
    anchor: "zp-tab-leaderboard",
    tab: "leaderboard",
    title: "The leaderboard",
    body: "See who's sharpest — ranked by a sharp score that rewards beating the market, or by raw ROI.",
  },
  {
    anchor: "zp-tab-record",
    tab: "record",
    title: "Your record",
    body: "Open a wallet, place bets, and watch your bankroll trend build — a record you can show off.",
  },
];

/**
 * A first-run guided tour of the ZeroProof lobby. Rendered only while running,
 * so it starts fresh at the consent step each time it's opened. The parent owns
 * whether it's shown and switches tabs through `onGoToTab`.
 */
export default function ZeroProofTour({
  onClose,
  onGoToTab,
}: {
  onClose: () => void;
  onGoToTab: (tab: TourTab) => void;
}) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const go = (target: number) => {
    const next = Math.max(0, Math.min(STEPS.length - 1, target));
    const s = STEPS[next];
    if (s.tab) onGoToTab(s.tab);
    setStep(next);
  };
  const next = () => (isLast ? onClose() : go(step + 1));
  const back = () => go(step - 1);

  // Measure the anchored element (in an animation frame, after any tab switch
  // has re-rendered the lobby), and keep the spotlight on it through resizes.
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

  // Card position: pinned near the spotlight when there is one, else centred.
  const cardStyle: React.CSSProperties = spotlight
    ? {
        position: "fixed",
        top: Math.min(spotlight.bottom + 12, window.innerHeight - 220),
        left: Math.max(
          12,
          Math.min(spotlight.left, window.innerWidth - 340),
        ),
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
      {/* Dim the page. A spotlight punches a hole with a huge ring shadow. */}
      {spotlight ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-lg ring-2 ring-primary-500 transition-all"
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
        aria-label="ZeroProof tour"
        style={cardStyle}
        className="w-[min(21rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-surface p-4 shadow-xl"
      >
        {step > 0 && (
          <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
            Step {step} of {STEPS.length - 1}
          </p>
        )}
        <h2 className="mt-0.5 text-base font-semibold text-foreground">
          {current.title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {current.body}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          {step === 0 ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              No thanks
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-3 py-1.5 text-sm text-muted hover:text-foreground"
              >
                Skip
              </button>
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-raised"
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
            className="rounded-full bg-primary-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            {step === 0 ? "Show me around" : isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
