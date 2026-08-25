"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ACCENT_BAND } from "@/lib/accentBand";
import { type GeneratedCard } from "@/lib/fantasy-cards";
import FantasyCard from "./FantasyCard";

/** Cosmetic pack designs to spin through — the pull is the same either way. */
const PACKS = [
  { id: "verdigris", label: "Verdigris", a: ACCENT_BAND.verdigris, b: ACCENT_BAND.teal },
  { id: "ember", label: "Ember", a: ACCENT_BAND.ember, b: ACCENT_BAND.gold },
  { id: "violet", label: "Violet", a: ACCENT_BAND.violet, b: ACCENT_BAND.indigo },
  { id: "coral", label: "Coral", a: ACCENT_BAND.coral, b: ACCENT_BAND.rose },
  { id: "azure", label: "Azure", a: ACCENT_BAND.azure, b: ACCENT_BAND.blue },
] as const;

type Phase = "select" | "rip" | "reveal";

/** Distance (px) the tear tab must be dragged to open the pack. */
const TEAR_THRESHOLD = 90;

function packStyle(pack: (typeof PACKS)[number]): React.CSSProperties {
  return { background: `linear-gradient(150deg, ${pack.a}, ${pack.b})` };
}

/**
 * Pokémon-Pocket-style pack opening: a full-screen overlay where you spin a
 * wheel of packs, tear the top open by dragging, and watch the cards flip out.
 * Every step has a keyboard/click path, and reduced-motion goes straight to the
 * reveal — the cards are already yours regardless of the theatre.
 */
export default function PackOpener({
  cards,
  onClose,
}: {
  cards: GeneratedCard[];
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  // Read the preference synchronously for the initial phase — framer's
  // useReducedMotion resolves to false on the first render, which would flash
  // the wheel before jumping to the reveal.
  const [phase, setPhase] = useState<Phase>(() =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? "reveal"
      : "select",
  );
  const [selected, setSelected] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pack = PACKS[selected];

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Opening a pack"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4 outline-none backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full border border-white/30 px-3 py-1 text-[13px] font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        Close
      </button>

      {phase === "select" ? (
        <div className="flex w-full max-w-2xl flex-col items-center">
          <p className="mb-6 text-[15px] font-medium text-white/80">Pick a pack</p>
          <m.div drag="x" dragElastic={0.15} className="flex cursor-grab gap-4 active:cursor-grabbing">
            {PACKS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelected(i);
                  setPhase("rip");
                }}
                aria-label={`Open the ${p.label} pack`}
                className="shrink-0 rounded-2xl border border-white/20 shadow-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                style={{ ...packStyle(p), width: 132, height: 200 }}
              >
                <span className="flex h-full items-end justify-center p-3 text-[13px] font-bold uppercase tracking-wide text-white/90">
                  {p.label}
                </span>
              </button>
            ))}
          </m.div>
          <p className="mt-6 text-[12px] text-white/50">Drag to spin, tap a pack to open it.</p>
        </div>
      ) : phase === "rip" ? (
        <div className="flex flex-col items-center">
          <p className="mb-4 text-[15px] font-medium text-white/80">Drag the tab down to rip it open</p>
          <div
            className="relative rounded-2xl border border-white/20 shadow-2xl"
            style={{ ...packStyle(pack), width: 200, height: 300 }}
          >
            <m.button
              type="button"
              drag="y"
              dragConstraints={{ top: 0, bottom: TEAR_THRESHOLD + 40 }}
              dragElastic={0.2}
              onDragEnd={(_e, info) => {
                if (info.offset.y > TEAR_THRESHOLD) setPhase("reveal");
              }}
              onClick={() => setPhase("reveal")}
              aria-label="Rip the pack open"
              className="absolute inset-x-0 top-0 h-9 cursor-grab rounded-t-2xl border-b-2 border-dashed border-white/50 bg-white/15 text-[12px] font-bold uppercase tracking-widest text-white active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              ✂ rip
            </m.button>
          </div>
          <button
            type="button"
            onClick={() => setPhase("reveal")}
            className="mt-6 rounded-full border border-white/40 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Rip open
          </button>
        </div>
      ) : (
        <div className="flex w-full max-w-3xl flex-col items-center">
          <p className="mb-4 text-[15px] font-semibold text-white">You pulled</p>
          <ul className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <AnimatePresence>
              {cards.map((card, i) => (
                <m.li
                  key={card.id}
                  initial={reduced ? false : { opacity: 0, rotateY: 90, y: 20 }}
                  animate={{ opacity: 1, rotateY: 0, y: 0 }}
                  transition={{ delay: reduced ? 0 : i * 0.18, type: "spring", stiffness: 220, damping: 20 }}
                >
                  <FantasyCard card={card} />
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-full border border-white bg-white px-5 py-1.5 text-[14px] font-semibold text-black hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
